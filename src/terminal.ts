import * as vscode from 'vscode';
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
    const resourceResult = insertVariable(command, 'resource', resource);
    const fullPathResult = insertVariable(resourceResult.command, 'file', fullPath);
    const clipboardResult = insertVariable(fullPathResult.command, 'clipboard', await vscode.env.clipboard.readText());

    return {
        command: clipboardResult.command,
        successful: resourceResult.successful && clipboardResult.successful
    };
}

function insertVariable(command: string, variable: string, value?: string) {
    let successful = true;
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