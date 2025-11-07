/**
 * The only interface you will need to implement :
 * - readonly name is a literal string (for type inference)
 * - example: class WhateverService implements ProgramPort<"whateverService">
 */

export abstract class ProgramPort<Name extends string> {
    public abstract readonly name: Name;
}
