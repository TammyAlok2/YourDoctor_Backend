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
})

const doctorNeed = model('DoctorNeed',doctorNeedHelp)

export{patientNeed,doctorNeed}

