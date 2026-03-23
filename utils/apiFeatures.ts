import { Query } from 'mongoose';

interface QueryString {
    page?: string | number;
    sort?: string;
    limit?: string | number;
    fields?: string;
    [key: string]: unknown;
}

class APIFeatures<T = unknown> {
    query: Query<T[], T>;
    queryString: QueryString;

    constructor(query: Query<T[], T>, queryString: QueryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter(): this {
        const queryObj: Record<string, unknown> = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        this.query.find(JSON.parse(queryStr));
        return this;
    }

    sort(): this {
        if (this.queryString.sort) {
            const sortBy = (this.queryString.sort as string).split(',').join(' ');
            this.query.sort(sortBy);
        } else {
            this.query.sort('-createdAt');
        }
        return this;
    }

    limitFields(): this {
        if (this.queryString.fields) {
            const fields = (this.queryString.fields as string).split(',').join(' ');
            this.query.select(fields);
        } else {
            this.query.select('-__v');
        }
        return this;
    }

    paginate(): this {
        const page = Number(this.queryString.page) || 1;
        const limit = Number(this.queryString.limit) || 100;
        const skip = (page - 1) * limit;
        this.query.skip(skip).limit(limit);
        return this;
    }
}

export = APIFeatures;
