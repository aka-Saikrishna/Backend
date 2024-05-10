import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  //  res.status(200).json({
  //     message: "changed"
  // })

  // Steps to register a user
  // get user details from frontend
  // validation - check for valid name, eemail, password and other required fields, not empty fields
  // check if user already exists - with username, email
  // check for Images, and avatars--- upload them to "cloudinary" if available
  // check them in cloudinary if it is uploaded successfully
  // create user object - create enty in db
  // remove password and refresh token field from response
  // check for user creation
  // return res else show error
  const { fullname, email, username, password } = req.body;
  console.log("fullname: ", fullname, "email: ", email);
  //Method-1 check for each and every field
  // if (fullname === "") {
  //     throw new ApiError(400, "fullname is required")
  // }

  // Method-2 using "some" method
  // some method will return true or false
  // we can use map metod also

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "user already exists");
  }
  console.log(req.files)
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.
    coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files?.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password, -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating a user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

export { registerUser };
