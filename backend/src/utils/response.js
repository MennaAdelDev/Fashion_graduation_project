function sendData(res, data, status = 200) {
  return res.status(status).json({ data });
}

function sendList(res, data, meta) {
  return res.status(200).json({ data, meta });
}

module.exports = { sendData, sendList };
