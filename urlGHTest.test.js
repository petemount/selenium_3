const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

let driver;

jest.setTimeout(60000); // Setzt den Timeout für den gesamten Test auf 60000 ms

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
        
        // Artikelseite einlesen u. prüfen, ob mehr als einer gefunden wird.    Die "höchste Ebene ist ..__item, nicht ..__name!"
        const articles = await driver.findElements(By.css('.listview__item')); //.listview__name war der Fehler! Diese ist der Artikel!
        expect(articles.length).toBeGreaterThan(0);
        
        // Die erste Seite der Suchergebnisse mit Namen, Link u. Preis anzeigen.
        const allArticles = [];
        for (let article of articles) {
          let articleElement = await article.findElement(By.css(".listview__name a"));
          let name = await articleElement.getText();
          let link = await articleElement.getAttribute("href");
            
          //let priceElement = await driver.findElement(By.css(".price")); -> falsch, greift immer wieder auf 1. Preis zu!
          let priceElement = await article.findElement(By.css(".price"));  
          let actualPrice = await priceElement.getText();                                      
          
          // Liste erstellen
          allArticles.push({ name, link, actualPrice })

          // Die Ergebnismenge in Datei schreiben.      
          fs.writeFileSync("listArticles.json", JSON.stringify(allArticles, null, 2));
}  
         
    // Optional: Hält die Seite die angegebenen Millisekunden offen.
    // setTimeout(async() => {
    //     await driver.quit();
    // }, 60000);
});
