export default {
    sendData,
    sendFailureMessage
};

function sendFailureMessage(error, res) {
    res.send({
        status: 'failure',
        message: error
    });
}

function sendData(data, res) {
    res.send({
        status: 'ok',
        data: data
    });
}