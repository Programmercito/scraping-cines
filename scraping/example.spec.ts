import { test, expect } from '@playwright/test';

test('scraping-multicine', async ({ page }) => {
  await page.goto('https://www.multicine.com.bo/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'multicine.png' });

  // Modificar directamente el DOM saltándose la capa de React
  await page.evaluate(() => {
    // Encontrar el elemento del dropdown
    const dropdown = document.querySelector('.dropdownBody');
    if (dropdown) {
      // Guardar contenido del dropdown para uso posterior
      const dropdownContent = dropdown.innerHTML;
      
      // Crear un nuevo elemento que contenga ese contenido pero sea visible
      const visibleDropdown = document.createElement('div');
      visibleDropdown.innerHTML = dropdownContent;
      visibleDropdown.style.position = 'fixed';
      visibleDropdown.style.top = '100px';
      visibleDropdown.style.left = '50px';
      visibleDropdown.style.backgroundColor = 'white';
      visibleDropdown.style.zIndex = '9999';
      visibleDropdown.style.border = '2px solid red';
      visibleDropdown.style.padding = '10px';
      
      // Añadir este nuevo elemento al DOM (fuera del control de React)
      document.body.appendChild(visibleDropdown);
      
      console.log('Contenido del dropdown extraído y mostrado');
    }
  });
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'multicine-content-visible.png' });
});