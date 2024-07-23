import express from 'express'

const app = express()

const port = 3001

app.get('/',(req,res)=>{
    res.json({
        message:"Welcome to your lab ",
        success:true
    })  
})
app.listen(port,()=>{
    console.log(`App is listening in ${port}`)
})

