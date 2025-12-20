export interface ParseResult {
    data: any;
    error: null | {
        message: string;
        line?: number;
    };
}

export const safeParseJSON = (jsonString: string): ParseResult => {
    try {
        const data = JSON.parse(jsonString);
        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: { message: e.message } };
    }
};

export const formatJSON = (jsonString: string, indent = 2): string => {
    try {
        const obj = JSON.parse(jsonString);
        return JSON.stringify(obj, null, indent);
    } catch (e) {
        return jsonString; // Return original if invalid
    }
};

export const minifyJSON = (jsonString: string): string => {
    try {
        const obj = JSON.parse(jsonString);
        return JSON.stringify(obj);
    } catch (e) {
        return jsonString;
    }
};

const sortJsonKeys = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(sortJsonKeys);
    } else if (typeof data === 'object' && data !== null) {
        return Object.keys(data)
            .sort()
            .reduce((acc: any, key) => {
                acc[key] = sortJsonKeys(data[key]);
                return acc;
            }, {});
    }
    return data;
};

export const formatAndSortJSON = (jsonString: string): string => {
    try {
        const obj = JSON.parse(jsonString);
        const sorted = sortJsonKeys(obj);
        return JSON.stringify(sorted, null, 2);
    } catch (e) {
        return jsonString;
    }
};
