import { Hono } from "@hono/hono";
import * as ics from "ics";

const app = new Hono();

app.get("/:date", async (c) => {
  const date = c.req.param("date");
  const datetime = decodeDatetime(date);
  console.log("date:", datetime);

  const event = {
    start: [
      datetime.getFullYear(),
      datetime.getMonth() + 1,
      datetime.getDate(),
      datetime.getHours(),
      datetime.getMinutes(),
    ],
    startInputType: "utc",
    duration: {
      hours: 1,
      //    minutes: 30
    },
    title: "Dental appointment",
    description: "Dental appointment booked at Sorrento Dental Clinic",
    location: "32 Seacrest Dr, Sorrento Western Australia",
    // url: 'http://www.bolderboulder.com/',
    // geo: { lat: 40.0095, lon: 105.2669 },
    // categories: ['10k races', 'Memorial Day Weekend', 'Boulder CO'],
    // status: 'CONFIRMED',
    // busyStatus: 'BUSY',
    // organizer: { name: 'Admin', email: 'Race@BolderBOULDER.com' },
    //   attendees: [
    //     { name: 'Adam Gibbons', email: 'adam@example.com', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
    //     { name: 'Brittany Seaton', email: 'brittany@example2.org', dir: 'https://linkedin.com/in/brittanyseaton', role: 'OPT-PARTICIPANT' }
    //   ]
  } satisfies ics.EventAttributes;

  const icsValue = await new Promise((resolve, reject) => {
    ics.createEvent(event, (error, value) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  }).catch((_err) => {
    throw new Error("Failed to create event");
  });
  // console.log("icsValue:", icsValue);
  c.header("Content-Type", "text/calendar");
  c.header("Content-Disposition", "attachment");
  c.header("filename", "dental_appointment.ics");

  return c.body(icsValue as string);
});

Deno.serve({ port: 8008 }, app.fetch);

function decodeDatetime(code: string) {
  // Restore padding if needed
  while (code.length % 4 !== 0) {
    code += "=";
  }
  code = code.replace(/-/g, "+").replace(/_/g, "/");

  const binaryStr = atob(code);
  const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));

  const bits = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];

  const yearOffset = (bits >> 16) & 0xF;
  const month = (bits >> 12) & 0xF;
  const day = (bits >> 7) & 0x1F;
  const hour = (bits >> 2) & 0x1F;
  const minuteQuarter = bits & 0x3;

  const year = 2025 + yearOffset;
  const minute = minuteQuarter * 15;

  const timezoneOffset = 8 * 60 * 60 * 1000;

  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) - timezoneOffset,
  );
}
