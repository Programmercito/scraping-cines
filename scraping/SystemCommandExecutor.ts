import { execSync } from 'child_process';

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

  public static gitPull(remote: string = 'origin', branch: string = 'main', workingDirectory?: string): string {
    try {
      const pullCommand = `git pull ${remote} ${branch}`;
      return this.executeCommand(pullCommand, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git pull: ${error}`);
    }
  }

  public static gitPush(remote: string = 'origin', branch: string = 'main', workingDirectory?: string): string {
    try {
      const pushCommand = `git push ${remote} ${branch} --force`;
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

  public static gitFetchAndReset(remote: string = 'origin', branch: string = 'main', workingDirectory?: string): string {
    try {
      const fetchCommand = `git fetch ${remote}`;
      const resetCommand = `git reset --hard ${remote}/${branch}`;
      
      // Ejecutar fetch primero
      this.executeCommand(fetchCommand, workingDirectory);
      
      // Luego ejecutar reset --hard
      return this.executeCommand(resetCommand, workingDirectory);
    } catch (error) {
      throw new Error(`Error during git fetch and reset: ${error}`);
    }
  }
}
