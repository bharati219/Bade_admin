var express = require("express");
var exe = require("./../connection");
var router = express.Router();

router.get("/", async function (req, res) {
  try {
    let slider = await exe(`SELECT * FROM slider`);
    let cards = await exe(`SELECT * FROM cards`);
    let about = await exe(`SELECT * FROM about`);
    let services = await exe(`SELECT * FROM services`);
    let reviews = await exe(`SELECT * FROM reviews`);
    let packages = await exe(`SELECT * FROM packages`);
    const obj = { slider: slider, cards: cards, about:about, services:services , reviews: reviews,packages:packages};
    
    res.render("user/home.ejs", obj);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/package/:id",async function(req, res) {
  var pid=req.params.id;
  var packages = await exe(`SELECT * FROM packages where package_id=?`, [pid]); 
  const package_service = await exe(`SELECT * FROM package_service where package_id=?`, [pid]);
  const key_highlight = await exe(`SELECT * FROM key_highlight where package_id=?`, [pid]);
  const obj6 ={packages:packages, package_service: package_service,key_highlight:key_highlight}
  // res.send(obj6);
  res.render("user/package.ejs",obj6);
})
  router.get("/about",async function(req, res) {
  var aslider = await exe(`SELECT * FROM about_slider`); 
  const info = await exe(`SELECT * FROM hospital_info`);
  let about = await exe(`SELECT * FROM about`);
  const stats  = await exe(`SELECT * FROM statistics`);
  let packages = await exe(`SELECT * FROM packages`);

  const obj1 = {aslider:aslider, info:info, about:about,stats:stats,packages:packages}
   res.render("user/about.ejs",obj1); // Ensure the correct path
});

router.get("/services",async function(req,res){
  var servslider = await exe(`SELECT * FROM service_sliders`);
  var serviceCareList = await exe("SELECT * FROM service_care"); 
  let specialServiceList = await exe(`SELECT * FROM special_service`);
  let packages = await exe(`SELECT * FROM packages`);

  const obj2 = {servslider:servslider,serviceCareList:serviceCareList,specialServiceList:specialServiceList,packages:packages}
  res.render("user/services.ejs",obj2)
})

router.get("/gallery",async function(req,res){
  var specialitySliderList = await exe(`SELECT * FROM speciality_slider`);
  let facilityList = await exe(`SELECT * FROM facility`);
  let packages = await exe(`SELECT * FROM packages`);

  const obj3 = {specialitySliderList:specialitySliderList,facilityList:facilityList,packages:packages}
  res.render("user/gallery.ejs", obj3)
})

router.get("/blog", async function(req,res){
  let bslider = await exe("SELECT * FROM blog_sliders");
  let blogCards = await exe("SELECT * FROM blog_cards");
  let packages = await exe(`SELECT * FROM packages`);

  const obj4 = {bslider:bslider,blogCards:blogCards,packages:packages}
  res.render("user/blog.ejs",obj4)
})
router.get("/department", async function(req,res){
  let departments = await exe("SELECT * FROM department") 
  let packages = await exe(`SELECT * FROM packages`);

 const obj5 = {departments:departments,packages:packages}
  res.render("user/department.ejs",obj5);
});
router.get("/appointment",async function(req,res){
  let packages = await exe(`SELECT * FROM packages`);
 const obj6 = {packages:packages}
  res.render("user/appoinment.ejs",obj6);
});
router.post("/save_appointment",async function(req,res){
    //res.send(req.body);
    var sql = `INSERT INTO book_appointment(name,mobile,email,date,doctor_name,message) VALUES (?,?,?,?,?,?)`;

    var d = req.body;
    var data = await exe (sql,[d.name,d.mobile,d.email,d.date,d.doctor_name,d.message]);
    

    res.redirect("/appointment");
});

router.get("/contact",async function(req,res){
  let packages = await exe(`SELECT * FROM packages`);
 const obj6 = {packages:packages}
  res.render("user/contact.ejs",obj6);
});
router.post("/save_contact", (req, res) => {
  const { name, email, message } = req.body;  
  const sql = "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)";
  exe(sql, [name, email, message], (err, result) => {
     
      res.redirect("/contact");
  });
});


module.exports = router;
