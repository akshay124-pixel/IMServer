const User = require("../Schema/Model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/config jwt");

// Signup Controller
const Signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user with email already exists
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    // Save the user to the database
    await newUser.save();

    // Generate token for new user
    const token = generateToken(newUser);

    // Return success response with token and user data
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res
      .status(500)
      .json({ message: "An error occurred during signup." });
  }
};
// Login Controller
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Incorrect password for user:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Send response with user data and token
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "An error occurred during login." });
  }
};

// Export controllers
module.exports = { Signup, Login };
