import { writeFile } from "fs";
import {
  findAllAdmins,
  getAdminList,
  removeGlobalAdmin,
} from "./services/admin.service";
import { findAllGroups } from "./services/group.service";

// findAllGroups()
//   .then((data) => {
//     console.log(data);
//   })
//   .catch((e) => {
//     writeFile("./error.txt", `${e}`, (err) => {
//       if (err) {
//         console.log(err);
//       }
//     });
//   });

// findAllAdmins().then((data) => {
//   console.log(data);
// });

// getAdminList().then((data) => {
//   console.log(data);
// });

// removeGlobalAdmin(123123)
//   .then((data) => {
//     console.log(data);
//   })
//   .catch((e) => {
//     console.log(e.code); // TODO: HANDLE ERROR
//   });
