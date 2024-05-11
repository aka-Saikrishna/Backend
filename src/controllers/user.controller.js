import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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
  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
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

const loginUser = asyncHandler(async (req, res) => {
  // req.body -> get data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookies

  const { email, username, password } = req.body;

  // either email is required or username
  // if (!(username || email)) {
  //   throw new ApiError(400, "username or email is required");
  // }



  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // find email or username
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPassowrdValid = await user.isPasswordCorrect(password);
  if (!isPassowrdValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // to design a cookie
  // cookies are by default easy to modify through frontend if we use the below optiosn enables, we cannot have access to change cookie in frontend. We have to  access by server to make changes. This will create safety for the server
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
try {
  
  const decodedToken =  jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  )
  const user = await User.findById(decodedToken?._id)
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }
  
  const options = {
    httpOnly: true,
    secure: true
  }
  const {accessToken, newRefreshToken}  = await generateAccessAndRefreshTokens(user._id)
  
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", newRefreshToken, options)
  .json(
    new ApiResponse(
      200, {accessToken, refreshToken: newRefreshToken},
      "Access token refreshed"
    )
  )
} catch (error) {
  throw new ApiError(401, error?.message || "Invalid refresh token")
}


})

export { registerUser, loginUser, logoutUser, refreshAccessToken };
