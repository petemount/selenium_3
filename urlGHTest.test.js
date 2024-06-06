const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

let driver;

jest.setTimeout(30000); // Setzt den Timeout für den gesamten Test auf 30000 ms

beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
});

afterAll(async () => {
    if (driver) {
        await driver.quit();
    }
});

test("Geizhals Artikelinfos scrapen", async () => {
    await driver.get("https://geizhals.de");

        // Cookie-Seite abfrühstücken.
        const okButton = await driver.wait(until.elementLocated(By.id('onetrust-accept-btn-handler')), 10000);
        await okButton.click();
        
        // Wartezeit hinzufügen, um sicherzustellen, dass die Haupt-Seite nach dem Klick vollständig geladen ist
        await driver.sleep(3000);

        // Überprüfe, ob das Hauptfenster noch offen und fokussiert ist
        let handles = await driver.getAllWindowHandles();
        if (handles.length > 0) {
            console.log("Switching to the main window...");
            await driver.switchTo().window(handles[0]);
        } else {
            throw new Error("No windows are open.");
        }

        // Eingabefeld und Suchlupe finden
        const suchEingabe = await driver.wait(until.elementLocated(By.id('gh-ac-input')), 10000);
        await suchEingabe.sendKeys('NVME-SSD');

        // Prüfen, ob das Suchlupen-Element mit der Klasse vorhanden ist
        const lupe = await driver.wait(until.elementLocated(By.className('gh-search-button')), 10000);
        
        // Suche ausführen
        await lupe.click();

        // Prüfen, ob der Suchbegriff auch im Seitentext im Titel "Deine Suche..." aufgenommen wurde   
        const zielFeldTest = await driver.findElement(By.xpath('//*[@id="main-content"]/div[1]/div[1]/h1/strong'));
        expect(await zielFeldTest.getText()).toBe('"NVME-SSD"'); 
        
        // Artikelseite einlesen u. prüfen, ob mehr als einer gefunden wird.
        const articles = await driver.findElements(By.css('.listview__name'));
        expect(articles.length).toBeGreaterThan(0);
        // const prices = await driver.findElements(By.css('.listview__price-link'));
        // expect (prices.length).toBeGreaterThan(0);

        // Die erste Seite der Suchergebnisse mit Namen u. link anzeigen.
        const allArticles = [];
        for (let article of articles) {
          let articleElement = await article.findElement(By.css(".listview__name a"));
          const name = await articleElement.getText();
          const link = await articleElement.getAttribute("href");
          allArticles.push({name,link})
          }  
          
        // const allPrices = [];
        // for (let price of prices) {
        //   let priceElement = await driver.findElement(By.css(".listview__price-link .price"));  --> aus irgend einen Grund, den ich um 22:56h nicht mehr suchen werde kommt immer nur der 1. Preis 
        //   const actualPrice = await priceElement.getText();                                     --> daher bleibts erstmal ohne zugehörigen Preis. 
        //   allPrices.push({actualPrice});  
        //   allArticles.push({actualPrice})          
        //   } 

        // Die Ergebnismenge in Datei schreiben.      
        fs.writeFileSync("listArticles.json", JSON.stringify(allArticles, null, 2));



    // Optional: Hält die Seite die angegebenen Millisekunden offen.
    // setTimeout(async() => {
    //     await driver.quit();
    // }, 60000);
});
