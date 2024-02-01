const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 4500;
const Restaurant = require('./models/restaurantModel');
const Counter = require('./models/Counter');
const CalculationFile = require('./models/FicheCalcule')
app.use(express.json());
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.use(cors());



app.use("/files", express.static("files"));
// Configure Multer
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});
const upload = multer({ storage: storage });

mongoose
  .connect('mongodb+srv://malekhzag2001:testappht2024@test.pvwcxzx.mongodb.net/test?retryWrites=true&w=majority')
  .then(() => {
    console.log('Connected with success');
    app.listen(port, () => {
      console.log(`Running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });


  //none
  app.get("/", async (req, res) => {
    res.send("Success!!!!!!");
  });

// Create a restaurant with auto-incremented r_id

app.post(
  '/createrestaurant',
  [
    // Your validation middleware
    body('CodeEBP').custom(async (value) => {
      // Check if CodeEBP is unique in the database
      const R_with_CodeEBP_exist = await Restaurant.findOne({ CodeEBP: value });
      if (R_with_CodeEBP_exist) {
        throw new Error('CodeEBP must be unique');
      }
      return true;
    }),
    // Add more rules for other fields
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Handle validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const counter = await Counter.findOneAndUpdate({}, { $inc: { id: 1 } }, { new: true, upsert: true }).session(session);

      // Adjust the DateOuverture by adding one day
      const restaurantData = { ...req.body, r_id: counter.id };
      restaurantData.DateOuverture = new Date(restaurantData.DateOuverture);
      restaurantData.DateOuverture.setDate(restaurantData.DateOuverture.getDate() + 1);

      // Note: Use an array for Model.create() in a transaction
      const restaurant = await Restaurant.create([restaurantData], { session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json(restaurant);
    } catch (error) {
      console.error(error.message);

      // Check for validation errors
      if (error.name === 'ValidationError') {
        // Rollback the counter increment on validation error
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        // Rollback the counter increment on other errors
        await session.abortTransaction();
        session.endSession();

        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
);

//Read a restaurant
app.get('/all_restaurant',async(req,res) =>{
  try {
    const restaurant= await Restaurant.find({})
    res.status(200).json(restaurant)
    
  } catch (error) {
    console.log(error.message)
    res.status(500).json({message: error.message })
  }


})
//Read a restaurant  by ID in Params
app.get('/restaurantbyidparams/:id',async(req,res) =>{
  const id = req.params.id;
  try {
    const restaurant= await Restaurant.findById(id);
    res.status(200).json(restaurant)
    
  } catch (error) {
    console.log(error.message)
    res.status(500).json({message: error.message })
  }


})
//Read a restaurant  by ID in body

app.get('/restaurantbyidbody/',async(req,res) =>{
  const id = req.body.id;
  try {
    const restaurant= await Restaurant.findById(id);
    res.status(200).json(restaurant)
    
  } catch (error) {
    console.log(error.message)
    res.status(500).json({message: error.message })
  }


})
// Update a restaurant
app.put('/restaurant/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(id, req.body, { new: true });
    if (!restaurant) {
      return res.status(404).json({ message: `Cannot find a restaurant with Id ${id}` });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

// Delete a restaurant 
app.delete('/restaurant/:id',async(req,res)=>{
  const id = req.params.id;
  try {
    const restaurant = await Restaurant.findByIdAndDelete(id);
  if (!restaurant) {
    return res.status(404).json({ message: `Cannot find a restaurant with Id ${id}` });
  }
  res.status(200).json("restaurant deleted");


    
  } catch (error) {
    console.log(error.message)
    res.status(500).json({message: error.message })
  }


})

// get restaurant by r_id 
app.get('/restaurantBy_r_id/:r_id', async (req, res) => {
  const r_id = req.params.r_id;

  try {
    const restaurant = await Restaurant.findOne({ r_id: r_id });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});
// Route to create a new calculation file
app.post('/createCalculefileddd', async (req, res) => {
  try {
      // Assuming you are receiving the necessary data in the request body
      const { date, r_id, settings, contentFile } = req.body;

      // Check if the restaurant with the specified r_id exists
      const existingRestaurant = await Restaurant.findOne({ r_id });
      if (!existingRestaurant) {
          return res.status(404).json({ error: 'Restaurant not found.' });
      }

      // Check if a calculation file for the given month and year already exists for the restaurant
      const existingCalculationFile = await CalculationFile.findOne({
          r_id,
          date
      });

      if (existingCalculationFile) {
          return res.status(409).json({ error: 'Calculation file for this month and year already exists.' });
      }

      // Create a new calculation file
      const newCalculationFile = new CalculationFile({
          date,
          r_id,
          settings,
          contentFile
      });

      // Save the calculation file
      await newCalculationFile.save();

      // Update the reference to the calculation file in the associated restaurant
      existingRestaurant.calculationFiles.push(newCalculationFile._id);
      await existingRestaurant.save();

      res.status(201).json({ message: 'Calculation file created successfully.', newCalculationFile });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/calculationFilesBy_r_id/:r_id', async (req, res) => {
  const r_id = req.params.r_id;

  try {
    const calculationFiles = await CalculationFile.find({ r_id: r_id });

    if (!calculationFiles) {
      return res.status(404).json({ message: 'No calculation files found for the provided r_id' });
    }

    res.status(200).json(calculationFiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});


//get bi _id

app.get('/calculationFilesBy_id/:_id', async (req, res) => {
  const _id = req.params._id;

  try {
    const calculationFile = await CalculationFile.findOne({ _id: _id });

    if (!calculationFile) {
      return res.status(404).json({ message: 'No calculation files found for the provided _id' });
    }

    res.status(200).json(calculationFile);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});


// PUT route to update contentFile of a CalculationFile
app.put('/savecontent/:id', async (req, res) => {
  const fileId = req.params.id;
  const newContent = req.body.content; // Assuming you're sending the updated content in the request body

  try {
    // Find the CalculationFile by ID
    const file = await CalculationFile.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'Calculation file not found' });
    }

    // Update the contentFile array
    file.contentFile = newContent;

    // Save the updated file
    await file.save();

    return res.status(200).json({ message: 'Calculation file updated successfully', file });
  } catch (error) {
    console.error('Error updating calculation file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



// file
// Combined route to create a new calculation file and upload the file
// Combined route to create a new calculation file and upload the file
app.post('/createCalculefile', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create a new CalculationFile instance
    const newCalculationFile = new CalculationFile({
      date: req.body.date, // Use current date as string
      r_id: req.body.r_id, // Assuming you are sending r_id in the request body
      file: req.file.filename, // Path to the uploaded file
      status: true // Default status
    });

    // Save the CalculationFile instance to the database
    await newCalculationFile.save();

    res.status(201).json({ message: 'File uploaded successfully' });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//get files 
app.get("/getfile/:id", async (req, res) => {
  const fileId = req.params.id;
  console.log(fileId);
  try {
    const file = await CalculationFile.findOne({ _id: fileId });
    if (!file) {
      return res.status(404).json({ status: "error", message: "File not found" });
    }
    
    // Construct the file path
    const filePath = path.join(__dirname, file.file);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: "error", message: "File not found on server" });
    }

    // Set response header for file download
    res.download(filePath, file.name);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ status: "error", message: "Failed to retrieve file" });
  }
});


//update
// Combined route to create a new calculation file and update the file
app.post('/updateCalculationFile/', upload.single('file'), async (req, res) => {
  try {
    const fileId = req.body.id;

    // Find the existing CalculationFile by ID
    const existingFile = await CalculationFile.findById(fileId);

    if (!existingFile) {
      return res.status(404).json({ message: 'Calculation file not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Remove the previous file associated with the calculation
    const filePath = path.join(__dirname, 'files', existingFile.file);
    fs.unlinkSync(filePath); // Delete the file from the file system

    // Update the filename and save the changes to the database
    existingFile.file = req.file.filename;
    await existingFile.save();

    res.status(200).json({ message: 'Calculation file updated successfully', filename: req.file.filename });
  } catch (err) {
    console.error('Error updating calculation file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/updateStatus/:id', async (req, res) => {
  const id = req.params.id; // Corrected variable name
 console.log(id)
  try {
    // Find the calculation file by _id
    const calculationFile = await CalculationFile.findById(id );

    if (!calculationFile) {
      return res.status(404).json({ message: 'No calculation files found for the provided _id' });
    }

    // Update the status to !status
    calculationFile.status = !calculationFile.status;

    // Save the updated calculation file
    await calculationFile.save();

    res.status(200).json({ message: 'Status updated successfully', calculationFile });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

app.put('/updateLock/:id', async (req, res) => {
  const id = req.params.id; // Corrected variable name
 console.log(id)
  try {
    // Find the calculation file by _id
    const calculationFile = await CalculationFile.findById(id );

    if (!calculationFile) {
      return res.status(404).json({ message: 'No calculation files found for the provided _id' });
    }

    // Update the status to !status
    calculationFile.locked = !calculationFile.locked;

    // Save the updated calculation file
    await calculationFile.save();

    res.status(200).json({ message: 'locked updated successfully', calculationFile });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});