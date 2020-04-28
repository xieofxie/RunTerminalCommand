import * as vscode from "vscode";
import { TerminalCommand } from './command';

export function getCommands(isFile: boolean) {
    return sanitizeConfiguration(getConfiguration(), isFile);
}

function getConfiguration() {
    return vscode.workspace
        .getConfiguration()
        .get('runTerminalCommand.commands');
}

function sanitizeConfiguration(configuration: any, isFile: boolean) {
    if (!Array.isArray(configuration)) {
        return [];
    }

    return configuration
        .filter(c => isNotEmptyString((c as TerminalCommand).command))
        .map<TerminalCommand>((c) => {
            const maybeCommand = c as TerminalCommand;
            return {
                command: maybeCommand.command,
                auto: !!maybeCommand.auto,
                preserve: !!maybeCommand.preserve,
                name: notEmptyStringOrUndefined(maybeCommand.name),
                group: notEmptyStringOrUndefined(maybeCommand.group),
                forFile: defaultTrue(maybeCommand.forFile),
                forFolder: defaultTrue(maybeCommand.forFolder)
            };
        })
        .filter((c) => {
            return c.forFile && isFile || c.forFolder && !isFile;
        });
}

function isNotEmptyString(value: any) {
    return typeof value === 'string' && value.trim().length > 0;
}

function notEmptyStringOrUndefined(value: any) {
    return isNotEmptyString(value) ? (value as string).trim() : undefined;
}

function defaultTrue(value: any) {
    return value == null ? true : !!value;
}