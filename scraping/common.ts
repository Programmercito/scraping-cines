import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';

export interface Cine {
  ciudades: Ciudad[];
  cine: string;
  fecha: string;
}

export interface Ciudad {
  peliculas: Pelicula[];
  ciudad: string;
}


export interface Pelicula {
  titulo: string;
  horarios: Horario[];
}

export interface Horario {
  horario: string;
  idioma: string;
  formato: string;
}

export class JsonFileWriter {
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
}

export class SystemCommandExecutor {
  public static executeCommand(command: string, workingDirectory?: string): string {
    try {
      const options = workingDirectory ? { cwd: workingDirectory } : {};
      const result = execSync(command, { ...options, encoding: 'utf-8' });
      return result;
    } catch (error) {
      throw new Error(`Error executing command "${command}": ${error}`);
    }
  }

  public static gitCommit(message: string, workingDirectory?: string): string {
    try {
      // Commit with message (files are already tracked)
      const commitCommand = `git commit -am "${message}"`;
      return this.executeCommand(commitCommand, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git commit: ${error}`);
    }
  }

  public static gitPush(remote: string = 'origin', branch: string = 'main', workingDirectory?: string): string {
    try {
      const pushCommand = `git push ${remote} ${branch}`;
      return this.executeCommand(pushCommand, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git push: ${error}`);
    }
  } 

  public static gitCommitAndPush(message: string, workingDirectory?: string, remote: string = 'origin', branch: string = 'main'): void {
    try {
      this.gitCommit(message, workingDirectory);
      this.gitPush(remote, branch, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git commit and push: ${error}`);
    } 
  }
}
