const Visitor = require("../models/Visitor");
const Student = require("../models/Student");

/**
 * Get daily statistics for visitors and students
 * @route GET /stats/today
 */
exports.getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    // Define the date range query
    const dateQuery = {
      entryTime: { $gte: today, $lt: tomorrow }
    };

    // Visitor Stats
    const totalVisitorsToday = await Visitor.countDocuments(dateQuery);
    const visitorsExitedToday = await Visitor.countDocuments({ ...dateQuery, hasExited: true });
    const visitorsPendingApproval = await Visitor.countDocuments({ exitRequested: true, exitApproved: false, hasExited: false });
    const visitorsApprovedNotExited = await Visitor.countDocuments({ exitApproved: true, hasExited: false });
    const visitorsCurrentlyInside = await Visitor.countDocuments({ hasExited: false }); // Count all not exited, regardless of entry date

    // Student Stats
    const totalStudentsToday = await Student.countDocuments(dateQuery);
    const studentsExitedToday = await Student.countDocuments({ ...dateQuery, hasExited: true });
    const studentsPendingApproval = await Student.countDocuments({ exitRequested: true, exitApproved: false, hasExited: false });
    const studentsApprovedNotExited = await Student.countDocuments({ exitApproved: true, hasExited: false });
    const studentsCurrentlyInside = await Student.countDocuments({ hasExited: false }); // Count all not exited

    res.status(200).json({
      visitors: {
        totalToday: totalVisitorsToday,
        exitedToday: visitorsExitedToday,
        pendingApproval: visitorsPendingApproval,
        approvedNotExited: visitorsApprovedNotExited,
        currentlyInside: visitorsCurrentlyInside, // Note: This counts *all* inside, not just today's entries
      },
      students: {
        totalToday: totalStudentsToday,
        exitedToday: studentsExitedToday,
        pendingApproval: studentsPendingApproval,
        approvedNotExited: studentsApprovedNotExited,
        currentlyInside: studentsCurrentlyInside, // Note: This counts *all* inside
      }
    });

  } catch (error) {
    console.error("Error fetching daily statistics:", error);
    res.status(500).json({ message: "Error fetching daily statistics", error: error.message });
  }
};