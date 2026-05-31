import express from 'express';
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let posts = [
      {
            id: "1",
            title: "My First Blog Post",
            content: "Welcome! This is a mock post ."
      }
];

app.get('/', (req, res) => {
      res.render('index', { posts: posts });
});

app.get('/posts/new', (req, res) => {
      res.render('create');
});

app.post('/posts', (req, res) => {
      const { title, content } = req.body;

      const newPost = {
            id: Date.now().toString(),
            title: title,
            content: content
      };

      posts.push(newPost);

      res.redirect('/');
});

app.get('/posts/:id/edit', (req, res) => {
      const targetedPost = posts.find(p => p.id === req.params.id);

      if (!targetedPost) {
            return res.status(404).send("Post not found");
      }

      res.render('edit', { post: targetedPost });
});

app.post('/posts/:id/update', (req, res) => {
      const { title, content } = req.body;

      const postIndex = posts.findIndex(p => p.id === req.params.id);

      if (postIndex !== -1) {
            posts[postIndex] = { id: req.params.id, title, content };
      }

      res.redirect('/');
});

app.post('/posts/:id/delete', (req, res) => {
      posts = posts.filter(p => p.id !== req.params.id);

      res.redirect('/');
});

app.listen(port, () => {
      console.log(`Server is listening successfully on port ${port}`);
});


/// Last commit