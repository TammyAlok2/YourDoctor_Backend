import { Schema ,model} from "mongoose";

const patientNeedHelp = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  number: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    
  },
});


const patientNeed = model('PatientNeedHelp',patientNeedHelp)


const doctorNeedHelp = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
      },
      number: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        
      },
})

const doctorNeed = model('DoctorNeed',doctorNeedHelp)

export{patientNeed,doctorNeed}

