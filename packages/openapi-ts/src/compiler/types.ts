import ts from 'typescript';

import { addLeadingJSDocComment, isType, ots } from './utils';

/**
 * Convert an unknown value to an expression.
 * @param value - the unknown value.
 * @returns ts.Expression
 */
export const toExpression = (value: unknown, unescape = false): ts.Expression | undefined => {
    if (Array.isArray(value)) {
        return createArrayType(value);
    }

    if (typeof value === 'object' && value !== null) {
        return createObjectType(value);
    }

    if (typeof value === 'number') {
        return ots.number(value);
    }

    if (typeof value === 'boolean') {
        return ots.boolean(value);
    }

    if (typeof value === 'string') {
        return ots.string(value, unescape);
    }

    if (value === null) {
        return ts.factory.createNull();
    }
};

/**
 * Create Array type expression.
 * @param arr - The array to create.
 * @param multiLine - if the array should be multiline.
 * @returns ts.ArrayLiteralExpression
 */
export const createArrayType = <T>(arr: T[], multiLine: boolean = false): ts.ArrayLiteralExpression =>
    ts.factory.createArrayLiteralExpression(
        arr.map(v => toExpression(v)).filter(isType<ts.Expression>),
        // Multiline if the array contains objects, or if specified by the user.
        (!Array.isArray(arr[0]) && typeof arr[0] === 'object') || multiLine
    );

/**
 * Create Object type expression.
 * @param obj - the object to create.
 * @param multiLine - if the object should be multiline.
 * @returns ts.ObjectLiteralExpression
 */
export const createObjectType = <T extends object>(obj: T, multiLine: boolean = true): ts.ObjectLiteralExpression =>
    ts.factory.createObjectLiteralExpression(
        Object.entries(obj)
            .map(([key, value]) => {
                const initializer = toExpression(value);
                return initializer ? ts.factory.createPropertyAssignment(key, initializer) : undefined;
            })
            .filter(isType<ts.PropertyAssignment>),
        multiLine
    );

export const createTypeAliasDeclaration = (
    name: string,
    type: string,
    typeParameters: string[] = [],
    comments?: Parameters<typeof addLeadingJSDocComment>[1]
) => {
    const node = ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(name),
        typeParameters.map(p => ts.factory.createTypeParameterDeclaration(undefined, p, undefined, undefined)),
        ts.factory.createTypeReferenceNode(type)
    );
    if (comments?.length) {
        addLeadingJSDocComment(node, comments);
    }
    return node;
};
