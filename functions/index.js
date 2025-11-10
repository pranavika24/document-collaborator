const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin
admin.initializeApp();

// Email transporter configuration
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: "manivasakampranavika024@gmail.com",
    pass: "wndqeumqxuypoqwh",
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

/**
 * Cloud Function to send email notifications when documents are updated
 * Trigger: Firestore document update
 */
exports.sendDocumentNotification = functions.firestore
    .document("documents/{docId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();
      const docId = context.params.docId;

      console.log(`📝 Document ${docId} updated`);

      // Skip if no significant changes
      if (before.content === after.content && before.title === after.title) {
        console.log("⏭️ No content changes - skipping notification");
        return null;
      }

      // Skip self-notifications
      if (before.lastUpdatedByEmail === after.lastUpdatedByEmail) {
        console.log("⏭️ Same user update - skipping self-notification");
        return null;
      }

      try {
        // Get all unique collaborators from all documents
        const snapshot = await admin.firestore().collection("documents").get();
        const emails = new Set();

        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Add document owner if not the updater
          if (data.ownerEmail && data.ownerEmail !== after.lastUpdatedByEmail) {
            emails.add(data.ownerEmail);
          }
          
          // Add all collaborators if array exists
          if (data.collaborators && Array.isArray(data.collaborators)) {
            data.collaborators.forEach(email => {
              if (email && email !== after.lastUpdatedByEmail) {
                emails.add(email);
              }
            });
          }
        });

        const recipients = Array.from(emails);

        if (recipients.length === 0) {
          console.log("📭 No recipients found for notification");
          return null;
        }

        console.log(`📧 Sending notifications to: ${recipients.join(", ")}`);

        // Prepare email content
        const updaterName = after.lastUpdatedBy || after.lastUpdatedByEmail?.split('@')[0] || "Someone";
        const updateTime = new Date().toLocaleString();

        const mailPromises = recipients.map((email) => {
          const mailOptions = {
            from: "Document Collaboration <manivasakampranavika024@gmail.com>",
            to: email,
            subject: `📝 ${after.title} was updated by ${updaterName}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { 
                    font-family: 'Arial', sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px;
                  }
                  .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0;
                  }
                  .content { 
                    background: #f8f9fa; 
                    padding: 25px; 
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #e0e0e0;
                  }
                  .button { 
                    display: inline-block; 
                    background: #667eea; 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold;
                    margin: 15px 0;
                  }
                  .footer { 
                    margin-top: 20px; 
                    padding-top: 20px; 
                    border-top: 2px solid #e0e0e0; 
                    color: #666; 
                    font-size: 12px;
                    text-align: center;
                  }
                  .info-grid {
                    display: grid;
                    gap: 10px;
                    margin: 15px 0;
                  }
                  .info-item {
                    background: white;
                    padding: 10px 15px;
                    border-radius: 6px;
                    border-left: 4px solid #667eea;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>📋 Document Updated</h1>
                  <p>You have a new update in your collaborative workspace</p>
                </div>
                
                <div class="content">
                  <h2 style="margin-top: 0;">${after.title}</h2>
                  
                  <div class="info-grid">
                    <div class="info-item">
                      <strong>👤 Updated by:</strong> ${updaterName}
                    </div>
                    <div class="info-item">
                      <strong>📧 Email:</strong> ${after.lastUpdatedByEmail || 'Not specified'}
                    </div>
                    <div class="info-item">
                      <strong>🕒 Time:</strong> ${updateTime}
                    </div>
                    <div class="info-item">
                      <strong>📊 Changes:</strong> Content ${before.content ? 'modified' : 'added'}
                    </div>
                  </div>

                  <div style="text-align: center;">
                    <a href="https://cloud-doc-system.netlify.app" class="button">
                      🚀 Open Document
                    </a>
                  </div>

                  <p style="color: #666; font-size: 14px; text-align: center;">
                    This is an automated notification from your Document Collaboration System.
                  </p>
                </div>

                <div class="footer">
                  <p><strong>Team:</strong> NAVYA.P, NISARGA.N, PRANAVIKA.M, PUNEETH.S.V</p>
                  <p>Document Collaboration System &copy; ${new Date().getFullYear()}</p>
                </div>
              </body>
              </html>
            `,
          };

          return transporter.sendMail(mailOptions)
              .then(() => {
                console.log(`✅ Email sent to: ${email}`);
              })
              .catch((error) => {
                console.error(`❌ Failed to send email to ${email}:`, error);
              });
        });

        await Promise.all(mailPromises);
        console.log(`🎉 All notifications sent successfully to ${recipients.length} recipients`);
        
      } catch (error) {
        console.error("💥 Error in sendDocumentNotification:", error);
      }

      return null;
    });

/**
 * Additional function: Send welcome email to new users
 */
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const email = user.email;
  const displayName = user.displayName || email.split('@')[0];

  try {
    const mailOptions = {
      from: "Document Collaboration <manivasakampranavika024@gmail.com>",
      to: email,
      subject: "🎉 Welcome to Document Collaboration System!",
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                     color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>Welcome to Document Collaboration! 🎉</h1>
          </div>
          <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px;">
            <h2>Hello ${displayName}!</h2>
            <p>Welcome to our collaborative document editing platform. You can now:</p>
            <ul>
              <li>📝 Create and edit documents in real-time</li>
              <li>👥 Collaborate with team members</li>
              <li>📧 Receive notifications on document changes</li>
              <li>💾 Auto-save your work automatically</li>
            </ul>
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://cloud-doc-system.netlify.app" 
                 style="background: #667eea; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold;">
                Get Started
              </a>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to: ${email}`);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
  }
});

/**
 * Keep function warm to reduce cold starts
 */
exports.keepWarm = functions.https.onRequest(async (req, res) => {
  res.status(200).send("Cloud Functions are warm! 🔥");
});