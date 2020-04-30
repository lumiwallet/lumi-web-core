const fs = require('fs')
const randomBytes = require('randombytes')

let data = randomBytes(1500000)

// Save byte entropy
fs.writeFile('output', data, 'utf8', function (err) {
  if (err) {
    return console.log(err)
  }
  console.log('The file was saved!')
})

