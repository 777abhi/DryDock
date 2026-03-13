import {
    graphql,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLList,
    GraphQLNonNull
} from 'graphql';
import { DryDockReport } from './types';

// Define the Occurrence type for CrossProjectLeakage
const OccurrenceType = new GraphQLObjectType({
    name: 'Occurrence',
    fields: {
        project: { type: new GraphQLNonNull(GraphQLString) },
        file: { type: new GraphQLNonNull(GraphQLString) },
        author: { type: GraphQLString },
        date: { type: GraphQLString }
    }
});

// Define the InternalDuplicate type
const InternalDuplicateType = new GraphQLObjectType({
    name: 'InternalDuplicate',
    fields: {
        hash: { type: new GraphQLNonNull(GraphQLString) },
        lines: { type: new GraphQLNonNull(GraphQLInt) },
        complexity: { type: new GraphQLNonNull(GraphQLInt) },
        frequency: { type: new GraphQLNonNull(GraphQLInt) },
        score: { type: new GraphQLNonNull(GraphQLFloat) },
        project: { type: new GraphQLNonNull(GraphQLString) },
        occurrences: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) }
    }
});

// Define the CrossProjectLeakage type
const CrossProjectLeakageType = new GraphQLObjectType({
    name: 'CrossProjectLeakage',
    fields: {
        hash: { type: new GraphQLNonNull(GraphQLString) },
        lines: { type: new GraphQLNonNull(GraphQLInt) },
        complexity: { type: new GraphQLNonNull(GraphQLInt) },
        frequency: { type: new GraphQLNonNull(GraphQLInt) },
        spread: { type: new GraphQLNonNull(GraphQLInt) },
        score: { type: new GraphQLNonNull(GraphQLFloat) },
        projects: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
        occurrences: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(OccurrenceType))) }
    }
});

// Define the Root Query Type that returns the report
const DryDockReportType = new GraphQLObjectType({
    name: 'DryDockReport',
    fields: {
        internal_duplicates: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(InternalDuplicateType)))
        },
        cross_project_leakage: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CrossProjectLeakageType)))
        }
    }
});

// Define the Schema
const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            report: {
                type: DryDockReportType,
                resolve: (root) => root // The root value will be the DryDockReport instance
            }
        }
    })
});

/**
 * Executes a GraphQL query against the provided DryDockReport.
 * @param report The current drydock report.
 * @param query The GraphQL query string.
 * @param variables Optional variables for the query.
 * @returns The GraphQL execution result.
 */
export async function executeGraphQL(report: DryDockReport, query: string, variables?: Record<string, any>) {
    return graphql({
        schema,
        source: query,
        rootValue: report,
        variableValues: variables
    });
}
