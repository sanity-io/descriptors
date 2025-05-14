import type {SchemaType} from './types'

export default [
  {
    name: 'person',
    title: 'Person',
    type: 'document',
    fields: [
      {
        name: 'fullName',
        title: 'Full name',
        type: 'string',
      },
      {
        name: 'portrait',
        title: 'Portrait',
        type: 'image',
        options: {
          hotspot: true,
        },
      },
    ],
  },
  {
    name: 'post',
    title: 'Post',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title!',
        type: 'string',
      },
      {
        name: 'author',
        title: 'Author',
        type: 'reference',
        to: {type: 'person'},
      },
    ],
  },
  {
    name: 'post2',
    title: 'Post',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
      },
      {
        name: 'author',
        title: 'Author',
        type: 'reference',
        to: {type: 'person'},
      },
    ],
  },
  {
    name: 'code',
    type: 'object',
    fields: [
      {
        name: 'language',
        title: 'Language',
        type: 'string',
      },
      {
        name: 'filename',
        title: 'Filename',
        type: 'string',
      },
      {
        title: 'Code',
        name: 'code',
        type: 'text',
      },
      {
        title: 'Highlighted lines',
        name: 'highlightedLines',
        type: 'array',
        of: [
          {
            type: 'number',
            title: 'Highlighted line',
          },
        ],
      },
    ],
  },
  {
    name: 'book',
    type: 'document',
    title: 'Book',
    description: 'This is just a simple type for generating some test data',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
      },
      {
        name: 'translations',
        title: 'Translations',
        type: 'object',
        fields: [
          {name: 'no', type: 'string', title: 'Norwegian (Bokmål)'},
          {name: 'nn', type: 'string', title: 'Norwegian (Nynorsk)'},
          {name: 'se', type: 'string', title: 'Swedish'},
        ],
      },
      {
        name: 'author',
        title: 'Author',
        type: 'reference',
        to: {type: 'author', title: 'Author'},
      },
      {
        name: 'coverImage',
        title: 'Cover Image',
        type: 'image',
        options: {hotspot: true},
      },
      {
        name: 'publicationYear',
        title: 'Year of publication',
        type: 'number',
      },
      {
        name: 'isbn',
        title: 'ISBN number',
        description: 'ISBN-number of the book. Not shown in studio.',
        type: 'number',
        hidden: true,
      },
      {
        name: 'reviewsInline',
        type: 'array',
        of: [
          {
            type: 'object',
            name: 'review',
            fields: [
              {
                name: 'title',
                title: 'Title',
                type: 'string',
              },
            ],
          },
        ],
      },
      {
        name: 'genre',
        title: 'Genre',
        type: 'string',
        options: {
          list: [
            {title: 'Fiction', value: 'fiction'},
            {title: 'Non Fiction', value: 'nonfiction'},
            {title: 'Poetry', value: 'poetry'},
          ],
        },
      },
    ],
  },
  {
    name: 'hello',
    type: 'world',
  },
] satisfies SchemaType[]
