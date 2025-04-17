var express = require("express");
const path = require("path");
const fs = require("fs");
const nodemailer = require('nodemailer');
var exe = require("./../connection");
var router = express.Router();





function verify_login(req,res,next)
{
    if(req.session.admin_id)
        next();
    else
        res.send("<script>location.href = document.referrer+'?login_required'</script>");
}
router.get("/", function(req,res){
    res.render("admin/login.ejs");
});

router.post("/save_data",async function(req,res){
  var d = req.body;
  var sql =`SELECT * FROM login WHERE hospital_email = ? AND hospital_password = ?` ;
  var data = await exe(sql, [d.email, d.password]);
    if(data.length > 0)
        {
        var admin_id = data[0].admin_id;
        req.session.admin_id = admin_id;
          let redirectUrl = req.get("/admin/")|| "index";
          redirectUrl = redirectUrl.replace("?login_required", "");   
          res.redirect(redirectUrl);
    }else
        res.send("login failed");
});

router.get("/logout",verify_login, function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
            res.send("Error logging out");
        } else {
            res.redirect("/admin"); 
        }
    });
});















// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bharatij219@gmail.com',
    pass: 'bfxd lkgi uoug iuvy'
  }
});

// Routes

// Forgot Password Route
router.get('/forgot_password', (req, res) => {
  res.send('<form action="/admin/send-otp" method="POST"><input type="email" name="hospital_email" required><input type="submit" value="Send OTP"></form>');
});

// Send OTP Route
router.post("/send-otp",async(req, res) => {
  const hospital_email = req.body.hospital_email;

  // Check if email exists
  await exe(`SELECT * FROM login WHERE hospital_email = ?`, [hospital_email],(err, results) =>{
    if (err){
      return res.status(500).send('database error');
    }

      if (results.length > 0) {
        const otp = Math.floor(1000 + Math.random() * 9000); // Generate OTP
        req.session.otp = otp;
        req.session.email = hospital_email;

        // Email Options
        const mailOptions = {
          from: "bharatij219@gmail.com",
          to: "darekarabhishek0@gmail.com", // Send OTP to user's email
          subject: "Password Reset OTP",
          text: `Your OTP for password reset is: ${otp}`,
        };

        // Send Email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
            return res.status(500).send("Error sending email");
          } else {
            res.send('<form action="/admin/verify-otp" method="POST"><input type="text" name="otp" required><input type="submit" value="Verify OTP"></form>'
            );
          }
        });

      } else {
        res.status(404).send("Email not found");
      }
    })
    .catch((err) => res.status(500).send("Database error"));
});
// Verify OTP Route
router.post('/verify-otp', (req, res) => {
  const otp = req.body.otp;

  if (otp == req.session.otp) {
    res.send('<form action="/admin/set-new-password" method="POST"><input type="password" name="new_password" required placeholder="New Password"><input type="password" name="confirm_password" required placeholder="Confirm Password"><input type="submit" value="Reset Password"></form>');
  } else {
    res.status(400).send('Invalid OTP');
  }
});

// Set New Password Route
router.post('/set-new-password', (req, res) => {
  const newPassword = req.body.new_password;
  const confirmPassword = req.body.confirm_password;

  if (newPassword === confirmPassword) {
    const email = req.session.email;

    // Update password in the database
    exe('UPDATE login SET hospital_password = ? WHERE hospital_email = ?', [newPassword, email])
    .then(() => {
      res.send('Password updated successfully. <a href="/admin/">Go to Login</a>');
    })
    .catch((err) => res.status(500).send("Database error"))
}
});

router.get("/",function(req,res){
    res.render("admin/login.ejs");
});
router.get('/logout', function (req, res, next) {
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        res.clearCookie('connect.sid'); // Clears the session cookie
        return res.redirect('/admin/'); // Ensure the correct redirection path
      }
    });
  } else {
    return res.redirect('/admin/'); // Redirect even if no session exists
  }
});


// router.post("/save_data",async function(req,res)
// {
//     var d = req.body;
//     var sql =`SELECT * FROM login WHERE hospital_email = ? AND hospital_password = ?` ;
//     var data = await exe(sql, [d.email, d.password]);
//     if(data.length > 0)
//     {
//         // res.send("login success");
//         res.redirect("/admin/index")
//     }
//     else{
//         // res.send("login failed");
//         res.redirect("/admin/");
//     }
// });
 router.get("/forgot_password",function(req,res){
  res.render("admin/forgot-password.ejs")
 })

router.get("/index",function(req,res){
    res.render("admin/index.ejs");
});
router.get("/profile",function(req,res){
  res.render("admin/profile.ejs");
});
router.post('/profile_update', (req, res) => {
  // Your update logic here
  res.send('Profile updated successfully');
});

router.get("/slider", async function(req, res) {
  var slider = await exe(`SELECT * FROM slider`); 
  console.log("Request received");
  res.render("admin/slider.ejs", { slider });
});

router.post("/save_slider", async function(req, res) {
  var img1 = "", img2 = "", img3 = "";
  
  if (req.files) {
      if (req.files.img1) {
          img1 = new Date().getTime() + req.files.img1.name;
          req.files.img1.mv("public/admin_assets/" + img1);
      }
      if (req.files.img2) {
          img2 = new Date().getTime() + req.files.img2.name;
          req.files.img2.mv("public/admin_assets/" + img2);
      }
      if (req.files.img3) {
          img3 = new Date().getTime() + req.files.img3.name;
          req.files.img3.mv("public/admin_assets/" + img3);
      }
  }

 
  var d = req.body;
  var sql = `INSERT INTO slider (text1, text2, text3, img1, img2, img3) VALUES (?,?,?,?,?,?)`;
  await exe(sql, [d.text1, d.text2, d.text3, img1, img2, img3]);

  res.redirect("/admin/slider");
});

router.get("/slider_list", async function(req, res) {
  var slider = await exe(`SELECT * FROM slider`);
  var obj = {slider:slider};
  res.render("admin/slider.ejs",obj);
});
router.get("/edit_slider/:id", async function (req, res) {
  var id = req.params.id;
  var data = await exe(`SELECT * FROM slider WHERE slider_id = ${id}`);
  var obj = { "slider": data[0] };
  res.render("admin/edit_slider.ejs", obj);
});

router.post("admin/update_slider", async function(req,res){
  try
  {
   var d = req.body;
   d.text1 = d.text1.replaceAll("'","\\'");
   d.text2 = d.text2.replaceAll("'","\\'");
   d.text3 = d.text3.replaceAll("'","\\'");
   d.text4 = d.text4.replaceAll("'","\\'");

   d.img1 = d.img1.replaceAll("'","\\'");
   d.img2 = d.img2.replaceAll("'","\\'");
   d.img3 = d.img3.replaceAll("'","\\'");
   d.img4 = d.img4.replaceAll("'","\\'");

   var id = req.body.slider_id;
  var d = req.body;

  var sql = `UPDATE slider SET
             text1 = '${d.text1}',
             text2 = '${d.text2}',
             text3 = '${d.text3}',
             text4 = '${d.text4}',

             img1 = '${d.img1}',
             img2 = '${d.img2}',
             img3 = '${d.img3}',
             img4 = '${d.img4}'

               WHERE slider_id = '${id}'`;
              var data = await exe(sql);
              res.redirect("/admin/slider_list");

          }catch(err){
              res.send("Invalid Data");
          }
      
});



router.get("/delete_slider/:id",  async function(req,res){
  var id = req.params.id;
  var sql = `DELETE FROM slider WHERE slider_id = '${id}'`;
  var data = await exe(sql);
  res.redirect("/admin/slider_list");
});


router.get("/card", (req, res) => {
  let sql = `SELECT * FROM cards`;
  exe(sql, (err, results) => {
      if (err) {
          console.error("Database Fetch Error:", err);
          return res.status(500).send("Database Error");
      }
      res.render("admin/card.ejs", { cards: results });
  });
});

router.post("/add_card", (req, res) => {
  let { main_heading, description } = req.body;
  let photo = req.files ? req.files.photo.name : "default.png";

  let uploadDir = path.join(__dirname, "../public/admin_assets/");
  if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
  }

  let uploadPath = path.join(uploadDir, photo);

  if (req.files) {
      req.files.photo.mv(uploadPath, (err) => {
          if (err) {
              console.error("File Upload Error:", err);
              return res.status(500).send("File Upload Failed");
          }
      });
  }

  let sql = `INSERT INTO cards (main_heading, photo, description) VALUES (?, ?, ?)`;
  exe(sql, [main_heading, photo, description], (err, result) => {
      if (err) {
          console.error("Database Insert Error:", err);
          return res.status(500).send("Database Error");
      }
      res.redirect("/admin/card");
  });
});

router.get("/edit_card/:id", (req, res) => {
    let cardId = req.params.id;
    let sql = `SELECT * FROM cards WHERE id = ?`;

    exe(sql, [cardId], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.render("admin/edit_card.ejs", { card: result[0] });
        } else {
            res.redirect("/admin/card");
        }
    });
});

router.post("/update_card/:id", (req, res) => {
    let cardId = req.params.id;
    let { main_heading, description } = req.body;

    let photo = req.files ? req.files.photo.name : null;

    if (req.files) {
        let uploadPath = path.join(__dirname, "../public/user_assets", photo);
        req.files.photo.mv(uploadPath);
    }

    let sql = photo ? `UPDATE cards SET main_heading=?, description=?, photo=? WHERE id=?`
        : `UPDATE cards SET main_heading=?, description=? WHERE id=?`;

    let params = photo ? [main_heading, description, photo, cardId] : [main_heading, description, cardId];

    exe(sql, params, (err, result) => {
        if (err) throw err;
        res.redirect("/admin/card");
    });
});

router.get("/delete_card/:id", (req, res) => {
    let cardId = req.params.id;

    let getImageSql = `SELECT photo FROM cards WHERE id = ?`;
    exe(getImageSql, [cardId], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            let imagePath = path.join(__dirname, "../public/user_assets", result[0].photo);
            fs.unlink(imagePath, (err) => {
                if (err) console.log("Image delete error:", err);
            });
        }

        let deleteSql = `DELETE FROM cards WHERE id = ?`;
        exe(deleteSql, [cardId], (err, result) => {
            if (err) throw err;
            res.redirect("/admin/card");
        });
    });
});
router.get("/about", async function(req, res) {
  try {
      var about = await exe("SELECT * FROM about"); 
      res.render("admin/about.ejs", { about });
  } catch (err) {
      console.error("Database Fetch Error:", err);
      res.status(500).send("Database Error");
  }
});

router.post("/save_about", async (req, res) => {
  try {
      var img = "";

      if (req.files && req.files.img) {
          img = new Date().getTime() + "_" + req.files.img.name;
          req.files.img.mv("public/admin_assets/" + img);
      }

      var d = req.body;
      var sql = `INSERT INTO about (img, heading, info, tag1, tag2, tag3) VALUES (?, ?, ?, ?, ?, ?)`;
      await exe(sql, [img, d.heading, d.info, d.tag1, d.tag2, d.tag3]);

      res.redirect("/admin/about");
  } catch (err) {
      console.error("Database Insert Error:", err);
      res.status(500).send("Error saving About data");
  }
});

router.get("/about_list", async function(req, res) {
  try {
      var about = await exe("SELECT * FROM about");
      res.render("admin/about.ejs", { about });
  } catch (err) {
      console.error("Database Fetch Error:", err);
      res.status(500).send("Database Error");
  }
});

router.get("/edit_about/:id", async (req, res) => {
  try {
      let aboutid = req.params.id;
      let about = await exe("SELECT * FROM about WHERE about_id = ?", [aboutid]);

      if (about.length > 0) {
          res.render("admin/edit_about.ejs", { about: about[0] });
      } else {
          res.redirect("/admin/about");
      }
  } catch (err) {
      console.error("Database Fetch Error:", err);
      res.status(500).send("Error fetching About entry");
  }
});

router.post("/update_about/:id", async (req, res) => {
  try {
      let id = req.params.id;
      let d = req.body;
      let img = d.old_img;

      if (req.files && req.files.img) {
          img = new Date().getTime() + "_" + req.files.img.name;
          req.files.img.mv("public/admin_assets/" + img);
      }

      let sql = `UPDATE about SET img=?, heading=?, info=?, tag1=?, tag2=?, tag3=? WHERE about_id=?`;
      await exe(sql, [img, d.heading, d.info, d.tag1, d.tag2, d.tag3, id]);

      res.redirect("/admin/about");
  } catch (err) {
      console.error("Database Update Error:", err);
      res.status(500).send("Error updating About entry");
  }
});

router.get("/delete_about/:id", async function(req, res) {
  try {
      let aboutid = req.params.id;

      let about = await exe("SELECT img FROM about WHERE about_id = ?", [aboutid]);

      if (about.length > 0) {
          let imagePath = "public/admin_assets/" + about[0].img;

          fs.unlink(imagePath, (err) => {
              if (err) console.log("Image delete error:", err);
          });

          await exe("DELETE FROM about WHERE about_id = ?", [aboutid]);
      }

      res.redirect("/admin/about");
  } catch (err) {
      console.error("Database Delete Error:", err);
      res.status(500).send("Error deleting About entry");
  }
});
router.get("/services", async function (req, res) {
  try {
    let services = await exe("SELECT * FROM services");
    res.render("admin/services.ejs", { services });
  } catch (err) {
    console.error(" Database Fetch Error:", err);
    res.status(500).send("Database Error");
  }
});

router.post("/save_service", async function (req, res) {
  let img = "";

  if (req.files && req.files.image) {
    img = new Date().getTime() + "_" + req.files.image.name;
    req.files.image.mv("public/admin_assets/" + img);
  }

  let { service_name, description } = req.body;
  let sql = `INSERT INTO services (service_name, description, image) VALUES (?, ?, ?)`;

  try {
    await exe(sql, [service_name, description, img]);
    res.redirect("/admin/services");
  } catch (err) {
    console.error(" Database Insert Error:", err);
    res.status(500).send("Database Error");
  }
});

router.get("/edit_service/:id", async function (req, res) {
  try {
    let id = req.params.id;
    console.log(" Received Service ID:", id);

    let service = await exe("SELECT * FROM services WHERE service_id = ?", [id]);

    if (service.length === 0) {
      console.error(" Error: No service found for ID:", id);
      return res.status(404).send("Service not found");
    }

    res.render("admin/edit_service.ejs", { service: service[0] });
  } catch (err) {
    console.error(" Database Fetch Error:", err);
    res.status(500).send("Error fetching service");
  }
});

router.post("/update_service/:id", async function (req, res) {
  try {
    let id = req.params.id;
    let { service_name, description } = req.body;
    let img = req.body.old_img; 

    if (req.files && req.files.image) {
      let newImg = new Date().getTime() + "_" + req.files.image.name;
      req.files.image.mv("public/admin_assets/" + newImg);

      if (img) {
        let imagePath = "public/admin_assets/" + img;
        fs.unlink(imagePath, (err) => {
          if (err) console.log(" Old image delete error:", err);
        });
      }

      img = newImg; 
    }

    let sql = `UPDATE services SET service_name=?, description=?, image=? WHERE service_id=?`;
    await exe(sql, [service_name, description, img, id]);

    res.redirect("/admin/services");
  } catch (err) {
    console.error(" Database Update Error:", err);
    res.status(500).send("Database Error");
  }
});

router.post("/delete_service/:id", async function (req, res) {
  try {
    let id = req.params.id;
    console.log(" Deleting Service ID:", id);

    let service = await exe("SELECT image FROM services WHERE service_id = ?", [id]);

    if (service.length > 0) {
      let imagePath = "public/admin_assets/" + service[0].image;

      fs.unlink(imagePath, (err) => {
        if (err) console.log(" Image delete error:", err);
      });

      await exe("DELETE FROM services WHERE service_id = ?", [id]);
    }

    res.redirect("/admin/services");
  } catch (err) {
    res.status(500).send("Database Error");
  }
});


router.get("/review", async function (req, res) {
  try {
    let reviews = await exe("SELECT * FROM reviews"); 
    res.render("admin/review.ejs", { reviews });
  } catch (err) {
    console.error("Database Fetch Error:", err);
    res.status(500).send("Database Error");
  }
});

router.post("/save_review", async function (req, res) {
  let img = "";
  
  if (req.files && req.files.image) {
    img = new Date().getTime() + "_" + req.files.image.name;
    req.files.image.mv("public/admin_assets/" + img);
  }

  let { name, message } = req.body;
  let sql = `INSERT INTO reviews (name, message, image) VALUES (?, ?, ?)`;
  
  try {
    await exe(sql, [name, message, img]);
    res.redirect("/admin/review");
  } catch (err) {
    console.error("Database Insert Error:", err);
    res.status(500).send("Error saving review");
  }
});

router.get("/edit_review/:id", async function (req, res) {
  let reviewId = req.params.id;
  
  try {
    let review = await exe("SELECT * FROM reviews WHERE id = ?", [reviewId]);
    
    if (review.length === 0) {
      return res.status(404).send("Review not found");
    }

    res.render("admin/edit_review.ejs", { review: review[0] });
  } catch (err) {
    console.error("Database Fetch Error:", err);
    res.status(500).send("Error fetching review");
  }
});

router.post("/update_review/:id", async function (req, res) {
  let reviewId = req.params.id;
  let { name, message } = req.body;
  let img = req.body.old_image;

  if (req.files && req.files.image) {
    let newImg = new Date().getTime() + "_" + req.files.image.name;
    req.files.image.mv("public/admin_assets/" + newImg);

    if (img) {
      fs.unlink("public/admin_assets/" + img, (err) => {
        if (err) console.log("Old image delete error:", err);
      });
    }

    img = newImg;
  }

  let sql = `UPDATE reviews SET name = ?, message = ?, image = ? WHERE id = ?`;
  
  try {
    await exe(sql, [name, message, img, reviewId]);
    res.redirect("/admin/review");
  } catch (err) {
    console.error("Database Update Error:", err);
    res.status(500).send("Error updating review");
  }
});

router.post("/delete_review/:id", async function (req, res) {
  let reviewId = req.params.id;

  try {
    let review = await exe("SELECT image FROM reviews WHERE id = ?", [reviewId]);

    if (review.length > 0) {
      let imagePath = "public/admin_assets/" + review[0].image;

      fs.unlink(imagePath, (err) => {
        if (err) console.log("Image delete error:", err);
      });

      await exe("DELETE FROM reviews WHERE id = ?", [reviewId]);
    }

    res.redirect("/admin/review");
  } catch (err) {
    console.error("Database Delete Error:", err);
    res.status(500).send("Error deleting review");
  }
});


//about page

router.get("/about_slider", async function(req, res) {
  var aslider = await exe(`SELECT * FROM about_slider`); 
  res.render("admin/about_slider.ejs", { aslider });
});

router.post("/save_aboutslider", async function(req, res) {
  var img1 = "";
  
  if (req.files) {
      if (req.files.img1) {
          img1 = new Date().getTime() + req.files.img1.name;
          req.files.img1.mv("public/admin_assets/" + img1);
      }
  }

  var d = req.body;
  var sql = `INSERT INTO about_slider (text1, img1) VALUES (?,?)`;
  await exe(sql, [d.text1, img1]);

  res.redirect("/admin/about_slider");
});

router.get("/about_slider_list", async function(req, res) {
  var aslider = await exe(`SELECT * FROM about_slider`);
  var obj = {aslider:aslider};
  res.render("admin/about_slider.ejs",obj);
});
router.get("/edit_abslider/:id", async function (req, res) {
  var id = req.params.id;
  var data = await exe(`SELECT * FROM about_slider WHERE aboutslider_id = ${id}`);
  var obj = { "aslider": data[0] };
  res.render("admin/edit_abslider.ejs", obj);
});

router.post("/update_abslider/:id", async function (req, res) {
  try {
      const id = req.params.id;
      let { text1, old_img1 } = req.body; 

      text1 = text1.replaceAll("'", "\\'");

      let img1 = old_img1; 
      if (req.files && req.files.img1) {
          let uploadedFile = req.files.img1;
          let newFileName = Date.now() + path.extname(uploadedFile.name); filename
          let uploadPath = path.join(__dirname, "../public/admin_assets", newFileName);

          await uploadedFile.mv(uploadPath);

          img1 = newFileName;
      }

      let sql = `UPDATE about_slider SET text1 = '${text1}', img1 = '${img1}' WHERE aboutslider_id = '${id}'`;

      await exe(sql);
      res.redirect("/admin/about_slider_list");
  } catch (err) {
      console.error("Update Error:", err);
      res.status(500).send("Invalid Data");
  }
});


router.get("/delete_abslider/:id", async function(req, res) {
  try {
      var id = req.params.id;

      var sql = `DELETE FROM about_slider WHERE aboutslider_id = ?`; 
      await exe(sql, [id]); 

      res.redirect("/admin/about_slider_list");
  } catch (err) {
      console.error("Delete Error:", err);
      res.status(500).send("error");
  }
});
router.get("/hospital_info", (req, res) => {
  const sql = `SELECT * FROM hospital_info`;
  exe(sql, (err, result) => {  
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Database error");
      }
      res.render("admin/hospital_info.ejs", { info: result }); 
  });
});

router.post("/save_hospital_info", (req, res) => {
  const { heading, info } = req.body;
  if (!heading || !info) {
      return res.status(400).send("All fields are required.");
  }

  const sql = "INSERT INTO hospital_info (heading, details) VALUES (?, ?)";
  exe(sql, [heading, info], (err, result) => {  
      if (err) {
          console.error("Insert error:", err);
          return res.status(500).send("Database insert error");
      }
      res.redirect("/admin/hospital_info"); 
  });
});


router.get("/edit_hospital_info/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM hospital_info WHERE id = ?`;
  exe(sql, [id], (err, result) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).send("Database fetch error");
    }
    if (result.length === 0) {
      return res.status(404).send("Record not found.");
    }
    res.render("admin/edit_hospital_info.ejs", { info: result[0] });
  });
});
router.post("/update_hospital_info/:id", async function (req, res) {
  try {
      var id = req.params.id;
      var { heading, info } = req.body;

      if (!heading || !info) {
          return res.status(400).send("All fields are required.");
      }

      var sql = `UPDATE hospital_info SET heading = ?, details = ? WHERE id = ?`;
      
      exe(sql, [heading, info, id], (err, result) => {
          if (err) {
              console.error("Update Error:", err);
              return res.status(500).send("Database update error");
          }

          res.redirect("/admin/hospital_info"); 
      });

  } catch (err) {
      console.error("Unexpected Error:", err);
      res.status(500).send("Unexpected error");
  }
});


router.get("/delete_hospital_info/:id", async function (req, res) {
  try {
    var id = req.params.id;
    var sql = `DELETE FROM hospital_info WHERE id = ?`;

    exe(sql, [id], (err, result) => {
      if (err) {
        console.error("Delete Error:", err.sqlMessage); 
        return res.status(500).send("Error: " + err.sqlMessage);
      }
      res.redirect("/admin/hospital_info");
    });

  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).send("Unexpected error");
  }
});

router.get("/about_statistics", (req, res) => {
  const sql =  `SELECT * FROM statistics`;
  exe(sql, (err, results) => {
      if (err) {
          console.error("Fetch Error:", err);
          return res.status(500).send("Database Error");
      }
      res.render("admin/about_statistics.ejs", { stats: results });
  });
});

router.post("/save_stat", (req, res) => {
  const { title, value } = req.body;
  const sql = `INSERT INTO statistics (title, value) VALUES (?, ?)`;
  exe(sql, [title, value], (err, result) => {
      if (err) {
          console.error("Insert Error:", err);
          return res.status(500).send("Database Insert Error");
      }
      res.redirect("/admin/about_statistics");
  });
});

router.get("/admin/edit_statistics/:id", async (req, res) => {
  try {
      const id = req.params.id;
      const sql = `SELECT * FROM statistics WHERE id = ?`;
     exe(sql, [id], (err, result) => {
          if (err) {
              console.error("Fetch Error:", err);
              return res.status(500).send("Database fetch error");
          }
          res.render("/admin/edit_statistics.ejs", { stat: result[0] }); 
      });
  } catch (error) {
      console.error("Unexpected Error:", error);
      res.status(500).send("Unexpected error");
  }
});
router.post("/admin/update_statistic/:id", async (req, res) => {
  try {
      const id = req.params.id;
      const { title, value } = req.body;

      if (!title || !value) {
          return res.status(400).send("All fields are required.");
      }

      const sql = `UPDATE statistics SET title = ?, value = ? WHERE id = ?`;
     exe(sql, [title, value, id], (err, result) => {
          if (err) {
              console.error("Update Error:", err);
              return res.status(500).send("Database update error");
          }
          res.redirect("/admin/statistics"); 
      });
  } catch (error) {
      console.error("Unexpected Error:", error);
      res.status(500).send("Unexpected error");
  }
});
router.get("/delete_stat/:id", (req, res) => {
  const sql = `DELETE FROM statistics WHERE id = ?`;
  exe(sql, [req.params.id], (err, result) => {
      if (err) {
          console.error("Delete Error:", err);
          return res.status(500).send("Database Delete Error");
      }
      res.redirect("/admin/about_statistics");
  });
});


//services


router.get("/service_slider", async function (req, res) {
  try {
      var servslider = await exe(`SELECT * FROM service_sliders`);  
      res.render("admin/service_slider.ejs", { servslider });  
  } catch (error) {
      console.error("Error fetching service sliders:", error);
      res.status(500).send("Database error");
  }
});

router.post("/save_serviceslider", async function (req, res) {
  let img1 = "";

  if (req.files && req.files.img1) {
      img1 = new Date().getTime() + req.files.img1.name;
      req.files.img1.mv("public/admin_assets/" + img1);
  }

  let { text1 } = req.body;
  let sql = `INSERT INTO service_sliders (text1, img1) VALUES (?, ?)`;
  
  await exe(sql, [text1, img1]);
  res.redirect("/admin/service_slider");
});

router.get("/edit_serviceslider/:id", async function (req, res) {
  let id = req.params.id;
  let data = await exe(`SELECT * FROM service_sliders WHERE service_id = ?`, [id]);

  if (data.length > 0) {
      res.render("admin/edit_serviceslider.ejs", { servslider: data[0] });
  } else {
      res.redirect("/admin/service_slider");
  }
});

router.post("/update_serviceslider/:id", async function (req, res) {
  try {
      let id = req.params.id;
      let { text1, old_img1 } = req.body;
      text1 = text1.replace(/'/g, "\\'"); 

      let img1 = old_img1;
      if (req.files && req.files.img1) {
          let uploadedFile = req.files.img1;
          let newFileName = Date.now() + path.extname(uploadedFile.name);
          let uploadPath = path.join(__dirname, "../public/admin_assets", newFileName);

          await uploadedFile.mv(uploadPath);
          img1 = newFileName;
      }

      let sql = `UPDATE service_sliders SET text1 = ?, img1 = ? WHERE service_id = ?`;
      await exe(sql, [text1, img1, id]);

      res.redirect("/admin/service_slider");
  } catch (err) {
      console.error("Update Error:", err);
      res.status(500).send("Error updating service slider");
  }
});

router.get("/delete_serviceslider/:id", async function (req, res) {
  try {
      let id = req.params.id;
      let sql = `DELETE FROM service_sliders WHERE service_id = ?`;
      await exe(sql, [id]);

      res.redirect("/admin/service_slider");
  } catch (err) {
      console.error("Delete Error:", err);
      res.status(500).send("Error deleting service slider");
  }
});
router.get("/service_care", async function(req, res) {
  try {
      var serviceCareList = await exe("SELECT * FROM service_care"); 
      res.render("admin/service_care.ejs", { serviceCareList });
  } catch (err) {
      console.error("Error fetching service care list:", err);
      res.status(500).send("Database Error");
  }
});
router.post("/save_servicecare", async function(req, res) {
  try {
      var { care_title, care_description } = req.body; 
      
      if (!care_title || !care_description) {
          return res.status(400).send("All fields are required");
      }

      var sql = `INSERT INTO service_care (care_title, care_description) VALUES (?, ?)`;
      await exe(sql, [care_title, care_description]);

      res.redirect("/admin/service_care");  
  } catch (err) {
      console.error("Error saving service care:", err);
      res.status(500).send("Database Error");
  }
});
router.get("/edit_servicecare/:id", async function(req, res) {
  try {
      let id = req.params.id;
      let data = await exe(`SELECT * FROM service_care WHERE care_id = ?`, [id]);

      if (data.length === 0) {
          return res.status(404).send("Service Care not found");
      }

      res.render("admin/edit_servicecare.ejs", { serviceCare: data[0] });
  } catch (err) {
      console.error("Edit Error:", err);
      res.status(500).send("Database Error");
  }
});
router.post("/update_servicecare/:id", async function(req, res) {
  try {
      let id = req.params.id;
      let { care_title, care_description } = req.body;

      let sql = `UPDATE service_care SET care_title = ?, care_description = ? WHERE care_id = ?`;
      await exe(sql, [care_title, care_description, id]);

      res.redirect("/admin/service_care");
  } catch (err) {
      console.error("Update Error:", err);
      res.status(500).send("Database Error");
  }
});
router.get("/delete_servicecare/:id", async function(req, res) {
  try {
      var id = req.params.id;

      var sql = `DELETE FROM service_care WHERE care_id = ?`; 
      await exe(sql, [id]); 

      res.redirect("/admin/service_care"); 
  } catch (err) {
      console.error("Delete Error:", err);
      res.status(500).send("Error deleting service care");
  }
});
router.get("/special_service", async function (req, res) {
  try {
      let specialServiceList = await exe(`SELECT * FROM special_service`);
      console.log("Fetched Data:", specialServiceList); 
      res.render("admin/special_service.ejs", { specialServiceList });
  } catch (err) {
      console.error("Fetch Error:", err);
      res.status(500).send("Database Error");
  }
});
router.post("/save_specialservice", async function (req, res) {
  try {
      let special_title = req.body.special_title;
      let special_description = req.body.special_description;
      let special_image = ""; 

      if (req.files && req.files.special_image) {
          let uploadedFile = req.files.special_image;
          special_image = Date.now() + uploadedFile.name;
          let uploadPath = path.join(__dirname, "../public/admin_assets", special_image);
          await uploadedFile.mv(uploadPath);
      }

      let sql = `INSERT INTO special_service (special_title, special_description, special_image) VALUES (?, ?, ?)`;
      await exe(sql, [special_title, special_description, special_image]);

      console.log("Service Added Successfully");
      res.redirect("/admin/special_service");
  } catch (err) {
      console.error("Insert Error:", err);
      res.status(500).send("Error saving data");
  }
});
router.get("/edit_specialservice/:id", async function (req, res) {
  try {
      let id = req.params.id;
      let data = await exe(`SELECT * FROM special_service WHERE special_id = ?`, [id]);

      if (data.length > 0) {
          res.render("admin/edit_specialservice.ejs", { specialService: data[0] });
      } else {
          res.status(404).send("Service not found");
      }
  } catch (err) {
      console.error("Fetch Error:", err);
      res.status(500).send("Database Error");
  }
});
router.post("/update_specialservice/:id", async function (req, res) {
  try {
      let id = req.params.id;
      let { special_title, special_description, old_image } = req.body;

      let special_image = old_image;

      if (req.files && req.files.special_image) {
          let uploadedFile = req.files.special_image;
          special_image = Date.now() + uploadedFile.name;
          let uploadPath = path.join(__dirname, "../public/admin_assets", special_image);
          await uploadedFile.mv(uploadPath);
      }

      let sql = `UPDATE special_service SET special_title = ?, special_description = ?, special_image = ? WHERE special_id = ?`;
      await exe(sql, [special_title, special_description, special_image, id]);

      console.log("Service Updated Successfully");
      res.redirect("/admin/special_service");
  } catch (err) {
      console.error("Update Error:", err);
      res.status(500).send("Error updating data");
  }
});
router.get("/delete_specialservice/:id", async function (req, res) {
  try {
      let id = req.params.id;

      let existingData = await exe(`SELECT special_image FROM special_service WHERE special_id = ?`, [id]);

      if (existingData.length > 0) {
          let imagePath = path.join(__dirname, "../public/admin_assets", existingData[0].special_image);

          if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
          }

          let sql = `DELETE FROM special_service WHERE special_id = ?`;
          await exe(sql, [id]);

          console.log("Service Deleted Successfully");
          res.redirect("/admin/special_service");
      } else {
          res.status(404).send("Service Not Found");
      }
  } catch (err) {
      console.error("Delete Error:", err);
      res.status(500).send("Error deleting service");
  }
});
router.get("/ambulance_service", async function (req, res) {
  let ambulanceServiceList = await exe("SELECT * FROM ambulance_service");
  res.render("admin/ambulance_service.ejs", { ambulanceServiceList });
});
router.post("/save_ambulance", async function (req, res) {
  let img1 = "";
  
  if (req.files && req.files.ambulance_image) {
      img1 = new Date().getTime() + path.extname(req.files.ambulance_image.name);
      req.files.ambulance_image.mv("public/admin_assets/" + img1);
  }

  let { ambulance_title, ambulance_description } = req.body;
  let sql = `INSERT INTO ambulance_service (ambulance_title, ambulance_description, ambulance_image) VALUES (?, ?, ?)`;
  await exe(sql, [ambulance_title, ambulance_description, img1]);

  res.redirect("/admin/ambulance_service");
});
router.get("/edit_ambulance/:id", async function (req, res) {
  let id = req.params.id;
  let data = await exe(`SELECT * FROM ambulance_service WHERE ambulance_id = ?`, [id]);
  res.render("admin/edit_ambulance.ejs", { ambulanceService: data[0] });
});
router.post("/update_ambulance/:id", async function (req, res) {
  let id = req.params.id;
  let { ambulance_title, ambulance_description, old_image } = req.body;
  
  let img1 = old_image; 
  if (req.files && req.files.ambulance_image) {
      img1 = new Date().getTime() + path.extname(req.files.ambulance_image.name);
      req.files.ambulance_image.mv("public/admin_assets/" + img1);
  }

  let sql = `UPDATE ambulance_service SET ambulance_title = ?, ambulance_description = ?, ambulance_image = ? WHERE ambulance_id = ?`;
  await exe(sql, [ambulance_title, ambulance_description, img1, id]);

  res.redirect("/admin/ambulance_service");
});
router.get("/delete_ambulance/:id", async function (req, res) {
  let id = req.params.id;

  let existingData = await exe(`SELECT ambulance_image FROM ambulance_service WHERE ambulance_id = ?`, [id]);

  if (existingData.length > 0) {
      let imagePath = path.join(__dirname, "../public/admin_assets", existingData[0].ambulance_image);
      if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
      }
      await exe(`DELETE FROM ambulance_service WHERE ambulance_id = ?`, [id]);
  }

  res.redirect("/admin/ambulance_service");
});

router.get("/speciality_slider", async function (req, res) {
  try {
      var specialitySliderList = await exe(`SELECT * FROM speciality_slider`);
      res.render("admin/speciality_slider.ejs", { specialitySliderList });
  } catch (error) {
      console.error("Error fetching speciality sliders:", error);
      res.status(500).send("Database error");
  }
});
router.post("/save_speciality", async function (req, res) {
  try {
      console.log("Received form data:", req.body); 
      console.log("Received files:", req.files); 
      if (!req.body.speciality_title) {
          return res.status(400).send("Error: speciality_title is required!");
      }

      let img1 = "";
      if (req.files && req.files.img1) {
          img1 = new Date().getTime() + "_" + req.files.img1.name;
          req.files.img1.mv("public/admin_assets/" + img1);
      }

      let { speciality_title } = req.body;
      let sql = `INSERT INTO speciality_slider (speciality_title, speciality_image) VALUES (?, ?)`;

      await exe(sql, [speciality_title, img1]);

      res.redirect("/admin/speciality_slider");
  } catch (error) {
      console.error("Error saving speciality:", error);
      res.status(500).send("Database operation failed.");
  }
});

router.get("/edit_speciality/:id", async function (req, res) {
    try {
        let speciality_id = req.params.id;
        let sql = `SELECT * FROM speciality_slider WHERE speciality_id = ?`;
        let speciality = await exe(sql, [speciality_id]);

        if (speciality.length > 0) {
            res.render("admin/edit_speciality.ejs", { speciality: speciality[0] });
        } else {
            res.status(404).send("Speciality not found");
        }
    } catch (error) {
        console.error("Error fetching speciality:", error);
        res.status(500).send("Database error");
    }
});

router.post("/update_speciality/:id", async function (req, res) {
    try {
        let speciality_id = req.params.id;
        let { speciality_title } = req.body;
        let img1 = "";

        let speciality = await exe(`SELECT speciality_image FROM speciality_slider WHERE speciality_id = ?`, [speciality_id]);

        if (speciality.length > 0) {
            let oldImage = speciality[0].speciality_image;

            if (req.files && req.files.speciality_image) {
                img1 = new Date().getTime() + req.files.speciality_image.name;
                req.files.speciality_image.mv("public/admin_assets/" + img1);

                if (oldImage) {
                    let oldImagePath = "public/admin_assets/" + oldImage;
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
            } else {
                img1 = oldImage; 
            }

            let updateSql = `UPDATE speciality_slider SET speciality_title = ?, speciality_image = ? WHERE speciality_id = ?`;
            await exe(updateSql, [speciality_title, img1, speciality_id]);

            res.redirect("/admin/speciality_slider");
        } else {
            res.status(404).send("Speciality not found");
        }
    } catch (error) {
        console.error("Error updating speciality:", error);
        res.status(500).send("Database operation failed.");
    }
});


router.get("/delete_speciality/:id", async function (req, res) {
  try {
      let sql = `DELETE FROM speciality_slider WHERE speciality_id = ?`;
      await exe(sql, [req.params.id]);
      res.redirect("/admin/speciality_slider");
  } catch (error) {
      console.error("Error deleting speciality:", error);
      res.status(500).send("Error deleting record.");
  }
});
router.get("/facility", async function (req, res) {
  try {
      let facilityList = await exe("SELECT * FROM facility");
      res.render("admin/facility.ejs", { facilityList });
  } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).send("An error occurred while fetching facilities.");
  }
});
router.post("/save_facility", async function (req, res) {
  try {
      let img = "";
      if (req.files && req.files.facility_image) {
          img = new Date().getTime() + req.files.facility_image.name;
          req.files.facility_image.mv("public/admin_assets/" + img);
      }

      let { facility_name } = req.body;
      await exe("INSERT INTO facility (facility_name, facility_image) VALUES (?, ?)", [facility_name, img]);

      res.redirect("/admin/facility");
  } catch (error) {
      console.error("Error saving facility:", error);
      res.status(500).send("An error occurred while saving the facility.");
  }
});
router.get("/edit_facility/:id", async function (req, res) {
  let facility_id = req.params.id;
  let facility = await exe("SELECT * FROM facility WHERE facility_id = ?", [facility_id]);

  if (facility.length > 0) {
      res.render("admin/edit_facility.ejs", { facility: facility[0] });
  } else {
      res.redirect("/admin/facility");
  }
});
router.post("/update_facility/:id", async function (req, res) {
  let facility_id = req.params.id;
  let { facility_name } = req.body;
  let img1 = req.files && req.files.facility_image ? new Date().getTime() + req.files.facility_image.name : null;

  if (img1) {
      req.files.facility_image.mv("public/admin_assets/" + img1);
      await exe("UPDATE facility SET facility_name = ?, facility_image = ? WHERE facility_id = ?", [facility_name, img1, facility_id]);
  } else {
      await exe("UPDATE facility SET facility_name = ? WHERE facility_id = ?", [facility_name, facility_id]);
  }

  res.redirect("/admin/facility");
});

router.get("/delete_facility/:id", async function (req, res) {
  let facility_id = req.params.id;
  let facility = await exe("SELECT facility_image FROM facility WHERE facility_id = ?", [facility_id]);

  if (facility.length > 0) {
      let fs = require("fs");
      let imagePath = "public/admin_assets/" + facility[0].facility_image;
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      await exe("DELETE FROM facility WHERE facility_id = ?", [facility_id]);
  }

  res.redirect("/admin/facility");
});


router.get("/blog_slider", async function (req, res) {
  try {
      let bslider = await exe("SELECT * FROM blog_sliders");
      console.log("Fetched Sliders:", bslider); 
      res.render("admin/blog_slider.ejs", { bslider });
  } catch (error) {
      console.error("Error fetching sliders:", error);
  }
});

router.post("/save_blogslider", async function (req, res) {
  try {
      let img = "";

      if (req.files && req.files.blog_image) {
          let file = req.files.blog_image;
          img = Date.now() + path.extname(file.name);
          await file.mv("public/admin_assets/" + img);
      }

      let { blog_title } = req.body; 

      const query = "INSERT INTO blog_sliders (blog_title, blog_image) VALUES (?, ?)";
      await exe(query, [blog_title, img]);

      res.redirect("/admin/blog_slider"); 
  } catch (error) {
      console.error("Error saving blog slider:", error);
  }
});
router.get("/edit_blogslider/:id", async function (req, res) {
  try {
      let blogslider_id = req.params.id;
      console.log("Fetching slider for ID:", blogslider_id);

      let result = await exe("SELECT * FROM blog_sliders WHERE blog_id = ?", [blogslider_id]);


      if (result.length > 0) {
          res.render("admin/edit_blogslider.ejs", { slider: result[0] }); // Ensure correct folder path
      } else {
          console.log("No slider found for the given ID.");
          res.redirect("/admin/blog_slider.ejs");
      }
  } catch (error) {
      console.error("Error fetching slider for edit:", error);
      res.status(500).send("An error occurred while fetching the slider.");
  }
});

router.post("/update_blogslider/:id", async function (req, res) {
  let blogslider_id = req.params.id;
  let { blog_title } = req.body;
  let img1 = req.files && req.files.blog_image ? new Date().getTime() + req.files.blog_image.name : null;

  if (img1) {
      req.files.blog_image.mv("public/admin_assets/" + img1);
      await exe("UPDATE blog_sliders SET blog_title = ?, blog_image = ? WHERE blog_id = ?", [blog_title, img1, blogslider_id]);
  } else {
      await exe("UPDATE blog_sliders SET blog_title = ? WHERE blog_id = ?", [blog_title, blogslider_id]);
  }

  res.redirect("/admin/blog_slider");
});


router.get("/delete_blogslider/:id", async function (req, res) {
  try {
      let blogslider_id = req.params.id;
      await exe("DELETE FROM blog_sliders WHERE blog_id = ?", [blogslider_id]);
      res.redirect("/admin/blog_slider");
  } catch (error) {
      console.error("Error deleting slider:", error);
  }
});


router.get("/blog_cards", async function (req, res) {
  try {
    let blogCards = await exe("SELECT * FROM blog_cards");
    res.render("admin/blog_cards.ejs", { blogCards });
  } catch (err) {
    console.error(" Database Fetch Error:", err);
    res.status(500).send("Database Error");
  }
});

router.post("/save_blog_card", async function (req, res) {
    try {
        let img = "";

        if (req.files && req.files.card_image) {
            let file = req.files.card_image;
            img = Date.now() + path.extname(file.name);
            await file.mv("public/admin_assets/" + img);
        }

        let { card_title, card_description } = req.body;

        const query = "INSERT INTO blog_cards (card_title, card_description, card_image) VALUES (?, ?, ?)";
        await exe(query, [card_title, card_description, img]);

        res.redirect("/admin/blog_cards"); 
    } catch (error) {
        console.error("Error saving blog card:", error);
        res.status(500).send("An error occurred while saving the blog card.");
    }
});

router.get("/edit_blog_card/:id", async function (req, res) {
  try {
      let card_id = req.params.id;
      console.log("Fetching blog card for ID:", card_id);

      let result = await exe("SELECT * FROM blog_cards WHERE card_id = ?", [card_id]);

      if (result.length > 0) {
          res.render("admin/edit_blog_card.ejs", { blogCard: result[0] });
      } else {
          console.log("No blog card found for the given ID.");
          res.redirect("/admin/blog_cards");
      }
  } catch (error) {
      console.error("Error fetching blog card for edit:", error);
      res.status(500).send("An error occurred while fetching the blog card.");
  }
});
router.post("/update_blog_card/:id", async function (req, res) {
  try {
      let card_id = req.params.id;
      let { card_title, card_description, old_image } = req.body;
      let final_image = old_image;

      if (req.files && req.files.card_image) {
          let file = req.files.card_image;
          final_image = Date.now() + path.extname(file.name);
          await file.mv("public/admin_assets/" + final_image);
      }

      let updateQuery = "UPDATE blog_cards SET card_title = ?, card_description = ?, card_image = ? WHERE card_id = ?";
      await exe(updateQuery, [card_title, card_description, final_image, card_id]);

      res.redirect("/admin/blog_cards");
  } catch (error) {
      console.error("Error updating blog card:", error);
      res.status(500).send("Internal Server Error");
  }
});
router.post("/delete_blog_card/:id", async function (req, res) {
  try {
      let card_id = req.params.id;

      let result = await exe("SELECT card_image FROM blog_cards WHERE card_id = ?", [card_id]);

      if (result.length > 0) {
          let fs = require("fs");
          let imagePath = "public/admin_assets/" + result[0].card_image;

          if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
          }

          await exe("DELETE FROM blog_cards WHERE card_id = ?", [card_id]);
      }

      res.redirect("/admin/blog_cards"); 
  } catch (error) {
      console.error("Error deleting blog card:", error);
      res.status(500).send("An error occurred while deleting the blog card.");
  }
});


router.get("/add_department", async function (req, res)  {
  let departments = await exe("SELECT * FROM department") 
  res.render("admin/add_department.ejs",{departments});  
});

router.post("/save_department", async (req, res) => {
  try {
      let { department_name, department_description } = req.body;
      let img = "";

      if (req.files && req.files.department_image) {
          let file = req.files.department_image;
          img = Date.now() + file.name;
          await file.mv("public/admin_assets/" + img);
      }

      await exe(
          "INSERT INTO department (department_name, department_description, department_image) VALUES (?, ?, ?)",
          [department_name, department_description, img]
      );

      res.redirect("/admin/add_department");
  } catch (error) {
      console.error("Error saving department:", error);
  }
});
router.get("/edit_department/:id", async (req, res) => {
  let department_id = req.params.id;
  let department = await exe("SELECT * FROM department WHERE department_id = ?", [department_id]);

  if (department.length > 0) {
      res.render("admin/edit_department.ejs", { department: department[0] });
  } else {
      res.redirect("/admin/add_department");
  }
});

router.post("/update_department/:id", async (req, res) => {
  try {
      let department_id = req.params.id;
      let { department_name, department_description } = req.body;

      let department = await exe("SELECT department_image FROM department WHERE department_id = ?", [department_id]);
      let img = department[0].department_image; 

      if (req.files && req.files.department_image) {
          let fs = require("fs");
          let oldImagePath = "public/admin_assets/" + img;

          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);

          let file = req.files.department_image;
          img = Date.now() + file.name;
          await file.mv("public/admin_assets/" + img);
      }

      await exe(
          "UPDATE department SET department_name = ?, department_description = ?, department_image = ? WHERE department_id = ?",
          [department_name, department_description, img, department_id]
      );

      res.redirect("/admin/add_department");
  } catch (error) {
      console.error("Error updating department:", error);
  }
});

router.post("/delete_department/:id", async (req, res) => {
  try {
      let department_id = req.params.id;

      let department = await exe("SELECT department_image FROM department WHERE department_id = ?", [department_id]);

      if (department.length > 0) {
          let fs = require("fs");
          let imagePath = "public/admin_assets/" + department[0].department_image;

          if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
          }

          await exe("DELETE FROM department WHERE department_id = ?", [department_id]);
      }

      res.redirect("/admin/add_department");
  } catch (error) {
      console.error("Error deleting department:", error);
      res.redirect("/admin/add_department");
  }
});
router.get("/add_package", async function (req, res) {
  try {
      let packages = await exe(`SELECT * FROM packages`);
      res.render("admin/add_package.ejs", { packages });
  } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).send("Internal Server Error");
  }
});

router.post("/save_package", async function (req, res) {
  try {
      const { package_name, package_title, package_description } = req.body;
      await exe("INSERT INTO packages (package_name, package_title, package_description) VALUES (?, ?, ?)", 
                [package_name, package_title, package_description]);
      res.redirect("/admin/add_package"); // Reload the page after inserting
  } catch (error) {
      console.error("Error adding package:", error);
      res.status(500).send("Internal Server Error");
  }
});
router.get("/edit_package/:id", async function (req, res) {
  try {
      let packageId = req.params.id;
      let packageData = await exe("SELECT * FROM packages WHERE package_id = ?", [packageId]);

      if (packageData.length === 0) {
          return res.status(404).send("Package not found");
      }

      res.render("admin/edit_package.ejs", { package: packageData[0] });
  } catch (error) {
      console.error("Error fetching package:", error);
      res.status(500).send("Internal Server Error");
  }
});
router.post("/update/:id", async function (req, res) {
  let { package_name, package_title, package_description } = req.body;
  let package_id = req.params.id;

  try {
      await exe(
          `UPDATE packages SET package_name = ?, package_title = ?, package_description = ? WHERE package_id = ?`,
          [package_name, package_title, package_description, package_id]
      );

      res.redirect("/admin/add_package");
  } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).send("Internal Server Error");
  }
});
router.get("/delete_package/:id", async function (req, res) {
  let package_id = req.params.id;

  try {
      await exe("DELETE FROM packages WHERE package_id = ?", [package_id]);
      res.redirect("/admin/add_package"); 
  } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).send("Internal Server Error");
  }
});

router.get("/package_service", async function (req, res) {
  try {
      let packages = await exe("SELECT * FROM packages");

      let packageServices = await exe(`
          SELECT ps.*, p.package_name 
          FROM package_service ps
          INNER JOIN packages p ON ps.package_id = p.package_id
      `);

      res.render("admin/package_service.ejs", { packages, packageServices });
  } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Internal Server Error");
  }
});

router.post("/add_package_service", async function (req, res) {
  console.log("Request Body:", req.body);
  console.log("Uploaded Files:", req.files);

  try {
      const { package_id, service_title, service_description } = req.body;

      if (!package_id || !service_title || !service_description || !req.files || !req.files.service_image) {
          return res.status(400).send("All fields are required!");
      }

      let service_image = req.files.service_image;
      let imagePath = "admin_assets/" + Date.now() + "-" + service_image.name; 

      await service_image.mv("public/" + imagePath);

      await exe(
          "INSERT INTO package_service (package_id, service_title, service_description, service_image) VALUES (?, ?, ?, ?)",
          [package_id, service_title, service_description, imagePath]
      );

      res.redirect("/admin/package_service");
  } catch (error) {
      console.error("Error adding package service:", error);
      res.status(500).send("Internal Server Error");
  }
});

router.get("/edit_package_service/:id", async function (req, res) {
  try {
      let service_id = req.params.id;

      let service = await exe("SELECT * FROM package_service WHERE pservice_id = ?", [service_id]);
      let packages = await exe("SELECT * FROM packages");

      if (service.length === 0) {
          return res.status(404).send("Package service not found!");
      }

      res.render("admin/edit_package_service.ejs", { service: service[0], packages });
  } catch (error) {
      console.error("Error fetching package service:", error);
      res.status(500).send("Internal Server Error");
  }
});

router.post("/update_package_service/:id", async function (req, res) {
  try {
      let service_id = req.params.id;
      const { package_id, service_title, service_description } = req.body;
      let service_image = null;

      let existingService = await exe("SELECT service_image FROM package_service WHERE pservice_id = ?", [service_id]);

      if (existingService.length === 0) {
          return res.status(404).send("Package service not found!");
      }

      service_image = existingService[0].service_image;

      if (req.files && req.files.new_service_image) {
          let imageFile = req.files.new_service_image;
          service_image = "admin_assets/" + Date.now() + "_" + imageFile.name;
          
          await imageFile.mv("public/" + service_image);
      }

      await exe(
          "UPDATE package_service SET package_id = ?, service_title = ?, service_description = ?, service_image = ? WHERE pservice_id = ?",
          [package_id, service_title, service_description, service_image, service_id]
      );

      res.redirect("/admin/package_service");
  } catch (error) {
      console.error("Error updating package service:", error);
      res.status(500).send("Internal Server Error");
  }
});

router.get("/delete_package_service/:id", async function (req, res) {
  try {
      let service_id = req.params.id;

      let service = await exe("SELECT service_image FROM package_service WHERE pservice_id = ?", [service_id]);
      if (service.length === 0) {
          return res.status(404).send("Package service not found!");
      }

      let imagePath = "public/" + service[0].service_image;
      if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); 
      }

      await exe("DELETE FROM package_service WHERE pservice_id = ?", [service_id]);

      res.redirect("/admin/package_service");
  } catch (error) {
      console.error("Error deleting package service:", error);
      res.status(500).send("Internal Server Error");
  }
});
router.get("/key_highlight", async function (req, res) {
  try {
    let packages = await exe("SELECT * FROM packages");

    let keyHighlights = await exe(`
        SELECT kh.*, p.package_name 
        FROM key_highlight kh
        INNER JOIN packages p ON kh.package_id = p.package_id
    `);

    res.render("admin/key_highlight.ejs", { packages, keyHighlights });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/key_highlight", async function (req, res) {
  try {
    const { package_id, plan_name, key_features, key_amount } = req.body;

    await exe(`
        INSERT INTO key_highlight (package_id, plan_name, key_features, key_amount)
        VALUES (?, ?, ?, ?)`, 
        [package_id, plan_name, key_features, key_amount]
    );

    res.redirect("/admin/key_highlight"); // Refresh page after adding
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/appointment", async function(req, res) {
      let appointments = await exe(`SELECT * FROM book_appointment`);
      res.render("admin/appoinments.ejs", { appointments: appointments });
 
});


module.exports = router;



