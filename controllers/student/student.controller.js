import Student from "../../models/student/student.model.js";
import generateToken from "../../config/token.js";
import xlsx from "xlsx";
import fs from "fs";

// Helper to format 24042004 to 24/04/2004
const formatDOB = (input) => {
  if (typeof input !== "string" || input.length !== 8) return input;
  return `${input.slice(0, 2)}/${input.slice(2, 4)}/${input.slice(4, 8)}`;
};

// --- ADMIN SIDE CONTROLLERS ---

export const createStudent = async (req, res) => {
  try {
    const { name, enrollmentNumber, dob, mobile, email, branch, year, college } = req.body;

    if (!name || !enrollmentNumber || !dob) {
      return res.status(400).json({ message: "Name, Enrollment Number and DOB are required" });
    }

    const existStudent = await Student.findOne({ enrollmentNumber });
    if (existStudent) {
      return res.status(400).json({ message: "Student with this enrollment number already exists" });
    }

    const newStudent = await Student.create({
      name,
      enrollmentNumber,
      dob,
      mobile,
      email,
      branch,
      year,
      college
    });

    res.status(201).json({ message: "Student created successfully", student: newStudent });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;

    const query = {};

    // Status Filter
    if (status !== undefined && status !== "") {
      query.isActive = status === "true";
    }

    // Global Search across fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { enrollmentNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { branch: { $regex: search, $options: "i" } },
        { college: { $regex: search, $options: "i" } },
        { year: { $regex: search, $options: "i" } }
      ];
    }

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Student.countDocuments(query);

    // Status counts for meta info
    const activeCount = await Student.countDocuments({ isActive: true });
    const inactiveCount = await Student.countDocuments({ isActive: false });

    res.status(200).json({
      students,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalStudents: count,
      stats: {
        active: activeCount,
        inactive: inactiveCount,
        total: activeCount + inactiveCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Toggle Status Request for ID:", id); // Check if request reaches here

    const student = await Student.findById(id);
    if (!student) {
      console.log("Student not found for ID:", id);
      return res.status(404).json({ message: "Student not found in database" });
    }

    student.isActive = !student.isActive;
    await student.save();

    console.log("Status updated successfully to:", student.isActive);
    res.status(200).json({ message: `Student status updated to ${student.isActive}`, student });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const importStudentsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an excel file" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const data of sheetData) {
      try {
        const { name, enrollmentNumber, dob, mobile, email, branch, year, college } = data;

        if (!name || !enrollmentNumber || !dob) {
          results.skipped++;
          continue;
        }

        const exist = await Student.findOne({ enrollmentNumber });
        if (exist) {
          results.skipped++;
          continue;
        }

        await Student.create({
          name,
          enrollmentNumber: enrollmentNumber.toString(),
          dob: dob.toString(),
          mobile: mobile?.toString() || "",
          email: email?.toString() || "",
          branch: branch?.toString() || "",
          year: year?.toString() || "",
          college: college?.toString() || ""
        });
        results.imported++;
      } catch (err) {
        results.errors.push({ enrollmentNumber: data.enrollmentNumber, error: err.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({ message: "Import completed", results });
  } catch (error) {
    console.error("Excel Import Error:", error);
    res.status(500).json({ message: "Failed to process excel file" });
  }
};

export const bulkCreateStudents = async (req, res) => {
  // console.log("██████████ BULK CREATE REQUEST RECEIVED ██████████");
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ message: "Invalid students data" });
    }

    const results = { imported: 0, skipped: 0, errors: [] };

    for (const data of students) {
      try {
        const exist = await Student.findOne({ enrollmentNumber: data.enrollmentNumber });
        if (exist) {
          results.skipped++;
          continue;
        }

        await Student.create(data);
        results.imported++;
      } catch (err) {
        results.errors.push({ enrollmentNumber: data.enrollmentNumber, error: err.message });
      }
    }

    res.status(200).json({ message: "Bulk import completed", results });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- STUDENT FACING CONTROLLERS ---

export const loginStudent = async (req, res) => {
  try {
    const { enrollmentNumber, password } = req.body;

    if (!enrollmentNumber || !password) {
      return res.status(400).json({ message: "Enrollment and password/DOB are required" });
    }

    const student = await Student.findOne({ enrollmentNumber });
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!student.isActive) return res.status(403).json({ message: "Account is inactive" });

    const formattedInputDOB = formatDOB(password);
    const dobMatch = formattedInputDOB === student.dob;
    const customPasswordMatch = student.password && password === student.password;

    if (dobMatch || customPasswordMatch) {
      const token = generateToken(student._id);
      return res.status(200).json({
        message: "Login successful",
        token,
        student: { _id: student._id, name: student.name, enrollmentNumber: student.enrollmentNumber, isPasswordCreated: student.isPasswordCreated }
      });
    }

    if (!student.isPasswordCreated && formattedInputDOB !== student.dob) {
      return res.status(400).json({ message: "Login using DOB (DDMMYYYY) first." });
    }

    return res.status(400).json({ message: "Invalid credentials" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: "Provide new password" });

    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.password = newPassword;
    student.isPasswordCreated = true;
    await student.save();

    res.status(200).json({ message: "Password created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const { password, ...data } = student._doc;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
