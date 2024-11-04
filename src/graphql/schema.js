const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String
    id: ID
  }
  type Token {
    value: String!
  }
  type Book{
    title:String!
    author:Author!
    published:String!
    genres:[String!]
  }
  type Author{
    name:String! 
    born:Int
    bookCount:Int
  }
  type Query {
    bookCount: Int!
    authorCount:Int!
    allBooks(author:String, genre:String):[Book!]
    allAuthors:[Author!]
    me:User
  }
  type Mutation{
    addBook(title:String!,author:String!,published:Int!,genres:[String!]):Book!
    editAuthor(name:String!,setBornTo:Int!): Author
    createUser(username:String!, password:String!) : User
    login(username:String!,password:String!):Token
  }
  type Subscription{
    bookAdded:Book!
  }
`;

export { typeDefs };
