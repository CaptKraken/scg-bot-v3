import {
  findAllAdmins,
  getAdminList,
  removeGlobalAdmin,
} from "./services/admin.service";

findAllAdmins().then((data) => {
  console.log(data);
});

getAdminList().then((data) => {
  console.log(data);
});

removeGlobalAdmin(123123)
  .then((data) => {
    console.log(data);
  })
  .catch((e) => {
    console.log(e.code); // TODO: HANDLE ERROR
  });
