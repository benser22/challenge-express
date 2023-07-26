var express = require("express");
var server = express();
var bodyParser = require("body-parser");

var model = {
  clients: {},
  reset: function () {
    this.clients = {};
  },
  addAppointment: function (name, { date }) {
    let dates = this.clients[name] || [];
    this.clients[name] = [...dates, { date: date, status: "pending" }];
  },
  attend: function (name, date) {
    this.clients[name].forEach((element) => {
      if (date === element.date) element.status = "attended";
    });
  },
  expire: function (name, date) {
    this.clients[name].forEach((element) => {
      if (date === element.date) element.status = "expired";
    });
  },
  cancel: function (name, date) {
    this.clients[name].forEach((element) => {
      if (date === element.date) element.status = "cancelled";
    });
  },
  erase: function (name, params) {
    let newDates = [];
    if (
      params !== "pending" &&
      params !== "attended" &&
      params !== "expired" &&
      params !== "cancelled"
    ) {
      this.clients[name].forEach((element) => {
        if (params !== element.date) newDates.push(element);
      });
      this.clients[name] = newDates;
    } else {
      this.clients[name].forEach((element) => {
        if (params !== element.status) newDates.push(element);
      });
      this.clients[name] = newDates;
    }
  },
  getAppointments: function (name, status = null) {
    if (!status) return this.clients[name];
    let onlyStatus = [];
    this.clients[name].forEach((element) => {
      if (status === element.status) onlyStatus.push(element);
    });
    return onlyStatus;
  },
  getClients: function () {
    return Object.keys(this.clients);
  },
};

server.use(bodyParser.json());

server.get("/api", (req, res) => {
  return res.json(model.clients);
});

server.post("/api/Appointments", (req, res) => {
  const client = req.body;

  if (!client.hasOwnProperty("client")) {
    return res.status(400).send("the body must have a client property");
  }

  const {
    client: name,
    appointment: { date },
  } = client;
  if (typeof name !== "string") {
    return res.status(400).send("client must be a string");
  }

  model.addAppointment(name, { date });

  const addedAppointment = { date, status: "pending" };
  return res.status(200).json(addedAppointment);
});

server.get("/api/Appointments/clients", (req, res) => {
  return res.status(200).send(model.getClients());
});

server.get("/api/Appointments/:name", (req, res) => {
  const { name } = req.params;
  const { date, option } = req.query;

  if (!model.clients.hasOwnProperty(name)) {
    return res.status(400).send("the client does not exist");
  }

  const dates = model.getAppointments(name);

  if (date) {
    let flag = false;
    dates.forEach((appointment) => {
      if (appointment.date === date) {
        flag = true;
      }
    });
    if (!flag) {
      return res
        .status(400)
        .send("the client does not have a appointment for that date");
    }
  }

  if (option !== "attend" && option !== "expire" && option !== "cancel") {
    return res.status(400).send("the option must be attend, expire or cancel");
  } else if (option === "attend") {
    model.attend(name, date);
    const modifiedAppointment = dates.find(
      (appointment) => appointment.date === date
    );
    return res.status(200).json(modifiedAppointment);
  } else if (option === "expire") {
    model.expire(name, date);
    const modifiedAppointment = dates.find(
      (appointment) => appointment.date === date
    );
    return res.status(200).json(modifiedAppointment);
  } else if (option === "cancel") {
    model.cancel(name, date);
    const modifiedAppointment = dates.find(
      (appointment) => appointment.date === date
    );
    return res.status(200).json(modifiedAppointment);
  }
});

server.get("/api/Appointments/:name/erase", (req, res) => {
  const { name } = req.params;
  const options = req.query;
  const { date } = options;
  // console.log("req.params", req.params, "     req.query", req.query);
  if (!model.clients.hasOwnProperty(name)) {
    return res.status(400).send("the client does not exist");
  } else {
    let array = model.getAppointments(name, date);
    model.erase(name, date);
    return array && res.status(200).json(array);
  }
});

server.get("/api/Appointments/getAppointments/:name", (req, res) => {
  const { name } = req.params;
  const { status } = req.query;

  if (!model.clients.hasOwnProperty(name)) {
    return res.status(400).send("the client does not exist");
  }

  if (
    status !== "pending" &&
    status !== "attended" &&
    status !== "expired" &&
    status !== "cancelled"
  ) {
    return res
      .status(400)
      .send("the status must be pending, attended, expired, or cancelled");
  }

  const appointmentsWithStatus = model.getAppointments(name, status);

  return res.status(200).json(appointmentsWithStatus);
});

server.listen(3000);
module.exports = { model, server };
