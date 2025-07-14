import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname } from 'path';

export class JsonFile {
  public static saveToJson(obj: any, filePath: string): void {
    try {
      // Create directory if it doesn't exist
      const dir = dirname(filePath);
      mkdirSync(dir, { recursive: true });

      // Convert object to JSON and write to file (overwrites if exists)
      const jsonString = JSON.stringify(obj, null, 2);
      writeFileSync(filePath, jsonString, 'utf-8');
    } catch (error) {
      throw new Error(`Error saving JSON to ${filePath}: ${error}`);
    }
  }
  
  public static getSavePath(): string {
    return '/opt/codes/horarios-cine';
  }
  
  public static getDosPath(): string {
    return '/docs';
  }
  
  public static loadFromFile(filePath: string): any {
    try {
      // Check if file exists
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file content
      const fileContent = readFileSync(filePath, 'utf-8');

      // Parse JSON content
      const jsonObject = JSON.parse(fileContent);

      return jsonObject;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format in file ${filePath}: ${error.message}`);
      }
      throw new Error(`Error loading JSON from ${filePath}: ${error}`);
    }
  }
}
