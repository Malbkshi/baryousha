import { categories, heroSlides } from './menu';
import * as fs from 'fs';

fs.writeFileSync('./src/data/menu.json', JSON.stringify({ categories, heroSlides }, null, 2));
console.log('Successfully exported menu.json');
