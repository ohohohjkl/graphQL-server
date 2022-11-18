import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import LRU from "lru-cache";
import { generate } from "shortid";
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `
  type Query {
    todos: [Todo]
		todo(id: String!): Todo
  }

	type Todo {
		id: String!
		type: String!
	}

	type Mutation {
		addTodo(type: String!): Todo
		updateTodo(id: String!, type: String!): Todo
		deleteTodo(id: String!): String
	}
`;
const cache = new LRU({ max: 50, maxAge: 1000 * 60 * 60 });
// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        todos: () => {
            const todos = [];
            cache.forEach((type, id) => todos.push({ type, id }));
            return todos;
        },
        todo: (_, { id }) => {
            return { id, type: cache.get(id) };
        },
    },
    Mutation: {
        addTodo: (_, { type }) => {
            const id = generate();
            const todo = { type, id };
            cache.set(id, type);
            return todo;
        },
        updateTodo: (_, { type, id }) => {
            const todo = { type, id };
            cache.set(id, type);
            return todo;
        },
        deleteTodo: (_, { id }) => {
            cache.delete(id);
            return id;
        },
    },
};
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
        // get the user token from the headers
        const token = req.headers.authorization || "";
        console.log({ token });
        // try to retrieve a user with the token
        // const user = getUser(token);
        // optionally block the user
        // we could also check user roles/permissions here
        // add the user to the context
        return null;
    },
});
console.log(`🚀  Server ready at: ${url}`);
