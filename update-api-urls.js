// Script para reemplazar todas las URLs hardcodeadas con la configuración de API
const fs = require('fs');
const path = require('path');

const API_URL_CONFIG = "import { API_URL } from '../config/api';\n";
const API_BASE_DECLARATION = "const API_BASE = API_URL;";

const filesToUpdate = [
    'src/contexts/AuthContext.js',
    'src/components/Dashboard/Dashboard.js',
    'src/components/Dashboard/DashboardSimple.js',
    'src/components/Dashboard/InternationalTradePanel.js',
    'src/components/DatosComerciales/DatosComerciales.js',
    'src/components/GraficosAvanzados/GraficosAvanzados.js'
];

filesToUpdate.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // Agregar import si no existe
        if (!content.includes("from '../config/api'") && !content.includes("from '../../config/api'")) {
            const importPath = filePath.includes('contexts') ? '../config/api' : '../../config/api';
            const importStatement = `import { API_URL } from '${importPath}';\n`;
            content = content.replace(/^(import.*\n)+/, match => match + importStatement);
        }

        // Reemplazar API_BASE = 'http://localhost:5000/api'
        content = content.replace(
            /const API_BASE = ['"]http:\/\/localhost:5000\/api['"];?/g,
            API_BASE_DECLARATION
        );

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Actualizado: ${filePath}`);
    } else {
        console.log(`⚠️  No encontrado: ${filePath}`);
    }
});

console.log('✅ Actualización completada');
