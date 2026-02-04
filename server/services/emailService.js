import SibApiV3Sdk from '@sendinblue/client';

// Initialize Brevo (Sendinblue) client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

/**
 * Send attendance notification email to student
 * @param {Object} params - Email parameters
 * @param {string} params.studentEmail - Student's email address
 * @param {string} params.studentName - Student's full name
 * @param {string} params.subject - Subject name
 * @param {string} params.date - Date of attendance
 * @param {string} params.status - 'present' or 'absent'
 * @param {string} params.facultyName - Faculty who marked attendance
 */
export const sendAttendanceEmail = async ({
    studentEmail,
    studentName,
    subject,
    date,
    status,
    facultyName
}) => {
    try {
        const statusLower = status.toLowerCase();
        const isPresent = statusLower === 'present';
        const isLate = statusLower === 'late';
        const isAbsent = statusLower === 'absent';

        let statusColor, statusText, statusIcon, statusBg;

        if (isPresent) {
            statusColor = '#22C55E';
            statusText = 'PRESENT';
            statusIcon = '✅';
            statusBg = '#F0FDF4';
        } else if (isLate) {
            statusColor = '#F59E0B';
            statusText = 'LATE';
            statusIcon = '⏰';
            statusBg = '#FFFBEB';
        } else {
            statusColor = '#EF4444';
            statusText = 'ABSENT';
            statusIcon = '❌';
            statusBg = '#FEF2F2';
        }

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.subject = `Attendance Update: ${statusText} - ${subject}`;
        sendSmtpEmail.sender = {
            name: process.env.BREVO_SENDER_NAME || 'SIET CSE Department',
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@sietcse.edu'
        };
        sendSmtpEmail.to = [{ email: studentEmail, name: studentName }];

        sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); border-radius: 12px 12px 0 0; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                ${statusIcon} Attendance Update
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                                SIET CSE Department
                            </p>
                        </td>
                    </tr>

                    <!-- Status Badge -->
                    <tr>
                        <td style="padding: 30px; text-align: center;">
                            <div style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 12px 30px; border-radius: 25px; font-size: 18px; font-weight: bold; letter-spacing: 1px;">
                                ${statusText}
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Dear <strong>${studentName}</strong>,
                            </p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Your attendance has been marked as <strong style="color: ${statusColor};">${statusText}</strong> for the following class:
                            </p>

                            <!-- Details Card -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">
                                                    <strong>Subject:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                                                    ${subject}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Date:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                                                    ${new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Marked By:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                                                    ${facultyName}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${isAbsent ? `
                            <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0; color: #991B1B; font-size: 14px; line-height: 1.6;">
                                    <strong>⚠️ Important:</strong> Please ensure regular attendance to maintain your academic standing. If you were absent due to valid reasons, please submit the necessary documentation to your faculty.
                                </p>
                            </div>
                            ` : isLate ? `
                            <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
                                    <strong>⏰ Note:</strong> You were marked as late for this class. Please try to arrive on time for future classes to avoid missing important content.
                                </p>
                            </div>
                            ` : `
                            <div style="background-color: #F0FDF4; border-left: 4px solid #22C55E; padding: 15px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                                    <strong>✓ Great!</strong> Keep up the good attendance record. Regular attendance is key to academic success.
                                </p>
                            </div>
                            `}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                                This is an automated notification from the SIET CSE Department.<br>
                                Please do not reply to this email.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                © ${new Date().getFullYear()} SIET CSE Department. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Attendance email sent successfully:', {
            to: studentEmail,
            status: statusText,
            messageId: result.messageId
        });
        return result;

    } catch (error) {
        console.error('❌ Failed to send attendance email:', error);
        throw error;
    }
};

/**
 * Send bulk attendance emails
 * @param {Array} attendanceRecords - Array of attendance records with student and status info
 */
export const sendBulkAttendanceEmails = async (attendanceRecords) => {
    const results = {
        success: [],
        failed: []
    };

    for (const record of attendanceRecords) {
        try {
            await sendAttendanceEmail(record);
            results.success.push(record.studentEmail);
        } catch (error) {
            results.failed.push({
                email: record.studentEmail,
                error: error.message
            });
        }
    }

    console.log(`📧 Bulk email results: ${results.success.length} sent, ${results.failed.length} failed`);
    return results;
};
