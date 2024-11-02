import User from '../models/User.js';
import Course from '../models/Course.js';

export const getDashboardData = async (req, res) => {
    try {
        // Get total number of users
        const userCount = await User.countDocuments();

        // Get number of admin users
        const adminCount = await User.countDocuments({ role: "admin" });

        // Get number of free and paid users
        const freeCount = await User.countDocuments({ type: "free" });
        const paidCount = await User.countDocuments({ type: "paid" });

        // Get total number of courses
        const courseCount = await Course.countDocuments();

        // Get number of video & text courses
        const videoAndTextCourseCount = await Course.countDocuments({ type: "video & text course" });

        // Get number of text & image courses
        const textAndImageCourseCount = await Course.countDocuments({ type: "text & image course" });

        // Get number of completed courses
        const completedCourseCount = await Course.countDocuments({ completed: true });

        // Prepare the response object
        const dashboardData = {
            users: userCount,
            admins: adminCount,
            frees: freeCount,
            paids: paidCount,
            courses: courseCount,
            videoAndTextCourses: videoAndTextCourseCount,
            textAndImageCourses: textAndImageCourseCount,
            completedCourses: completedCourseCount
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};