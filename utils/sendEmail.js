import nodemailer from "nodemailer";


// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async function (email, subject, message) {
  try {
    let transporter = await nodemailer.createTransport({
      name: 'smtp.gmail.com', // mail.example.com or smtp.mail.com
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port:  587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'yourlab2025@gmail.com',
        pass:  'uyqu fxaj vmhj ixnf',
      },
      
    });
     await transporter.verify(function(error, success) {
      if (error) {
            console.log("Connection error:", error);
      } else {
            console.log('Server is ready to take our messages');
      }
    });
    console.log(email)
    const mailOptions = {
      from: 'yourlab2025@gmail.com', // sender address
      to: email, // user email
      subject: subject, // Subject line
      html: message, // html body
    };
    await transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log("Error :", error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


export default sendEmail;
