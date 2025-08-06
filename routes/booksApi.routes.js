const express = require('express');
const axios = require('axios');
const router = express.Router();


router.get('/search-books', function (req, res, next) {
    const term = req.query.q;

    // request to Open Library, limiting to 7 books
    axios.get('https://openlibrary.org/search.json', {
        params: { q: term, limit: 7 }
    })
        .then(function (olRes) {
            const olBooks = olRes.data.docs.map(function (book) {
                return {
                    key: book.key || null,
                    title: book.title || null,
                    authors: book.author_name || [],
                    publishedYear: book.first_publish_year || null,
                    isbn: book.isbn ? book.isbn[0] : null,
                    coverUrl: book.cover_i
                        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                        : null,
                    language: (book.language && book.language[0]) || null,
                    subjects: book.subject ? book.subject.slice(0, 5) : [],
                    source: 'openlibrary'
                };
            });

            // request to Google Books API (without keys!)
            axios.get('https://www.googleapis.com/books/v1/volumes', {
                params: { q: term, maxResults: 10 } // key should go here??
            })
                .then(function (gbRes) {
                    const gbBooks = Array.isArray(gbRes.data.items) // gbRes.data.items is the array of books
                        ? gbRes.data.items.map(function (item) {
                            const info = item.volumeInfo || {};
                            return {
                                id: item.id,
                                title: info.title || null,
                                authors: info.authors || [],
                                publishedYear: info.publishedDate
                                    ? info.publishedDate.slice(0, 4)
                                    : null,
                                isbn: (info.industryIdentifiers && info.industryIdentifiers.length)
                                    ? info.industryIdentifiers[0].identifier
                                    : null,
                                coverUrl: info.imageLinks && info.imageLinks.thumbnail
                                    ? info.imageLinks.thumbnail.replace('http://', 'https://')
                                    : null,
                                language: info.language || null,
                                subjects: info.categories || [],
                                source: 'googlebooks'
                            };
                        })
                        : [];

                    // combine Open Library + Google Books results
                    const allBooks = olBooks.concat(gbBooks);
                    res.json(allBooks);

                })
                .catch(function (gbError) {
                    // if Google Books fails, only show Open Library results
                    res.json(olBooks);
                });

        })
        .catch(function (olError) {
            // if Open Library fails, try Google Books alone
            axios.get('https://www.googleapis.com/books/v1/volumes', {
                params: { q: term, maxResults: 10 }
            })
                .then(function (gbRes) {
                    const gbBooks = Array.isArray(gbRes.data.items)
                        ? gbRes.data.items.map(function (item) {
                            const info = item.volumeInfo || {};
                            return {
                                id: item.id,
                                title: info.title || null,
                                authors: info.authors || [],
                                publishedYear: info.publishedDate
                                    ? info.publishedDate.slice(0, 4)
                                    : null,
                                isbn: (info.industryIdentifiers && info.industryIdentifiers.length)
                                    ? info.industryIdentifiers[0].identifier
                                    : null,
                                coverUrl: info.imageLinks && info.imageLinks.thumbnail
                                    ? info.imageLinks.thumbnail.replace('http://', 'https://')
                                    : null,
                                language: info.language || null,
                                subjects: info.categories || [],
                                source: 'googlebooks'
                            };
                        })
                        : [];
                    res.json(gbBooks);
                })
                .catch(function () {
                    res.status(500).json({ message: "Both APIs failed" });
                });
        });
});

module.exports = router;