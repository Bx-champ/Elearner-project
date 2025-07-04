const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');

dotenv.config();
const app = express();
app.get('/',(req,res)=>{
    res.send("server is running");
}); 

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

const adminUploadRoute = require('./routes/adminUpload');
app.use('/api/admin', adminUploadRoute);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
