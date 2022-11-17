require("dotenv").config();
const { faker } = require("@faker-js/faker");
const { By, Key, Builder, until } = require("selenium-webdriver");
require("chromedriver");

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const signOutPath = By.css(`button.btn.btn-default`);
const listInputPath = By.css(`input[ng-model='home.list']`);
const submitListBtnPath = By.css(`button.task-btn`);
const listItem = (listName) => By.css(`a[href='#!/list/${listName}']`);
const deleteListItem = (listName) =>
  By.xpath(`//a[@href="#!/list/${listName}"]/../..//button`);

async function login(driver) {
  const originalWindow = await driver.getWindowHandle();
  await driver.findElement(By.className("btn-github")).click();
  await driver.wait(
    async () => (await driver.getAllWindowHandles()).length === 2,
    10000
  );

  //Loop through until github login page is found
  const windows = await driver.getAllWindowHandles();
  for (let i = 0; i < windows.length; i += 1) {
    const handle = windows[i];
    if (handle !== originalWindow) {
      await driver.switchTo().window(handle);
    }
  }

  try {
    // Wait for login form to load
    await driver.wait(until.elementLocated(By.name("login")), 10000);
    // Enter Credentials
    await driver.findElement(By.name("login")).sendKeys(username);
    await driver.findElement(By.name("password")).sendKeys(password);
    await driver.findElement(By.name("commit")).click();
  } catch (err) {
    // Most likely github login is cached
  }
  await driver.switchTo().window(originalWindow);
  await driver.wait(until.elementLocated(signOutPath), 10000);
}

async function CRUD() {
  const url = "https://todo-list-login.firebaseapp.com/";
  const driver = await new Builder().forBrowser("chrome").build();
  try {
    await driver.get(url);
    await login(driver);

    const listNames = [];
    while (listNames.length < 10) {
      listNames.push(faker.name.fullName());
    }
    // Print List
    console.log(listNames);
    for (let i = 0; i < listNames.length; i += 1) {
      const listName = listNames[i];
      await driver.findElement(listInputPath).sendKeys(listName);
      await driver.findElement(submitListBtnPath).click();
      const list = await driver.wait(
        until.elementLocated(listItem(listName), 10000)
      );
      // Assert list is created
      console.log(await list.getText());
    }

    await driver.findElement(signOutPath).click();
    await driver.wait(until.elementLocated(By.className("btn-github")), 10000);
    await login(driver);
    for (let i = 5; i < listNames.length; i += 1) {
      await driver.findElement(deleteListItem(listNames[i])).click();
    }
    await driver.findElement(signOutPath).click();
  } catch (err) {
    console.log(err);
  } finally {
    await driver.quit();
  }
}

CRUD();
