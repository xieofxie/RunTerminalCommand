import * as vscode from 'vscode';
import * as path from 'path';
import { TerminalCommand } from './command';

let previousTerminal: vscode.Terminal | undefined;

export async function runCommand(command: TerminalCommand, cwd?: string, resource?: string, fullPath?: string) {
    const terminal = vscode.window.createTerminal({ cwd: cwd });
    terminal.show();

    ensureDisposed();

    const result = await insertVariables(command.command, resource, fullPath);

    terminal.sendText(result.command, command.auto && result.successful);

    if (!command.preserve) {
        previousTerminal = terminal;
    }
}

function ensureDisposed() {
    if (previousTerminal) {
        previousTerminal.dispose();
        previousTerminal = undefined;
    }
}

async function insertVariables(command: string, resource?: string, fullPath?: string) {
    let result = insertVariable(command, 'resource', resource);
    result = insertVariable(result.command, 'file', fullPath, result.successful);
    result = insertVariable(result.command, 'fileDirname', path.dirname(fullPath || ''), result.successful);
    result = insertVariable(result.command, 'clipboard', await vscode.env.clipboard.readText(), result.successful);

    return {
        command: result.command,
        successful: result.successful
    };
}

function insertVariable(command: string, variable: string, value?: string, lastSuccessful: boolean = true) {
    let successful = lastSuccessful;
    const pattern = `{${variable}}`;

    if (new RegExp(pattern, 'i').test(command)) {
        command = command.replace(new RegExp(pattern, 'ig'), value || '');

        if (!value) {
            successful = false;
        }
    }

    return {
        command,
        successful
    };
}