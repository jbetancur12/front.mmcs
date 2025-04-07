export const bandwidthLogger = (req, res, next) => {
  const chunks = []
  const startTime = Date.now()

  // Bytes entrantes
  let incomingBytes = 0
  req.on('data', (chunk) => {
    incomingBytes += chunk.length
  })

  // Bytes salientes
  const originalWrite = res.write
  const originalEnd = res.end
  let outgoingBytes = 0

  res.write = function (chunk, encoding, callback) {
    if (chunk) {
      outgoingBytes += Buffer.byteLength(chunk)
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding))
    }
    return originalWrite.call(res, chunk, encoding, callback)
  }

  res.end = function (chunk, encoding, callback) {
    if (chunk) {
      outgoingBytes += Buffer.byteLength(chunk)
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding))
    }

    const duration = Date.now() - startTime
    const body = Buffer.concat(chunks).toString('utf8')

    console.log(`📡 ${req.method} ${req.originalUrl}`)
    console.log(`➡️  Incoming: ${incomingBytes} bytes`)
    console.log(`⬅️  Outgoing: ${outgoingBytes} bytes`)
    console.log(`⏱️  Time: ${duration} ms`)
    console.log('----------------------------')

    return originalEnd.call(res, chunk, encoding, callback)
  }

  next()
}
