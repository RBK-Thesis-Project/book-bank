var express = require('express');
var router = express.Router();
var bookBankDB = require('../../database/db.js');

router.route('/:userId').get(function(req, res) {
	var userId = req.params.userId;

	bookBankDB.getUserProfie(userId, function(err, profile) {
		if (err) throw err;
		console.log(profile);
		res.json(profile);
	});
});

//----------------- Add  new Book (bluePrint then donated) -------------
router.route('/:userId/addBlueprintDonatedBook').post(function(req, res) {
	// var { name, description, imgUrl, uniId, userId } = req.body;
	const dataFromClient = req.body;

	// console.log(dataFromClient);

	// console.log(req.body);

	var bluePrintBookInfo = {
		bookName: dataFromClient.name,
		bookCover: dataFromClient.imgUrl,
		bookDescription: dataFromClient.description,
		universityId: dataFromClient.universityId,
		createdAt: Date.now()
	};

	var donatedBookInfo = {
		userId: dataFromClient.userId,
		bookId: '',
		availability: true,
		createdAt: Date.now()
	};
	// console.log(bluePrintBookInfo);
	// console.log(donatedBookInfo);
	// res.json('body here is ');

	//-------------Create New BluePrint doc (Book Doc)-------------------
	bookBankDB.saveBook(bluePrintBookInfo, function(err, bluePrintBook) {
		if (err) throw err;

		console.log('New Blueprint book has been adde successfully!' + bluePrintBook);
		var bluePrintId = bluePrintBook._id;
		console.log(bluePrintId);
		donatedBookInfo['bookId'] = bluePrintId;
		console.log(donatedBookInfo);

		//-------------Create New DonatedBook doc-------------------
		bookBankDB.saveDonatedBook(donatedBookInfo, function(err, newDonatedBook) {
			if (err) {
				throw err;
			}

			console.log('new donated book has been added ' + newDonatedBook);
			var response = {
				bluePrint: bluePrintBook,
				Donated: newDonatedBook
			};
			res.json(response);
		});
	});
});

//----------------- Add  new Book donated -------------
router.route('/:userId/AddDonatedBook').post(function(req, res) {
	const dataFromClient = req.body;

	var donatedBookInfo = {
		userId: dataFromClient.userId,
		bookId: dataFromClient.bookId,
		availability: true,
		createdAt: Date.now()
	};

	//-------------Create New DonatedBook doc-------------------
	bookBankDB.saveDonatedBook(donatedBookInfo, function(err, newDonatedBook) {
		if (err) {
			throw err;
		}

		console.log('new donated book has been added ' + newDonatedBook);

		res.json(newDonatedBook);
	});
});
//-------------get bluePrint books of user's donated books -------------------
router.route('/:userId/donatedBooksAsBluePrints').get(function(req, res) {
	const userId = req.params.userId;
	bookBankDB.getDonatedBooksAsBluePrintsForUser(userId, function(err, donatedBooksOfUser) {
		if (err) {
			throw err;
		}
		console.log(donatedBooksOfUser);
		var bluePrintBooksId = donatedBooksOfUser.map(function(donatedBook) {
			return donatedBook.bookId;
		});

		bookBankDB.getAllBluePrintBooksdonatedByUser(bluePrintBooksId, function(err, bluePrintBooksdonatedByUser) {
			if (err) {
				throw err;
			}
			res.json(bluePrintBooksdonatedByUser);
		});
	});
});

//==============================================================
//---------------Might face a sync issues here------------------
//==============================================================

//------------Get books requests from the user  ----------------
router.route('/:userId/requestedBooks').get(function(req, res) {
	const userId = req.params.userId;
	bookBankDB.getRequestedBooks(userId, function(err, requestedBooks) {
		if (err) throw err;
		console.log(requestedBooks);

		var requestersId = requestedBooks.map(function(requestedBook) {
			return requestedBook.requesterId;
		});

		bookBankDB.findRequesterName(requestersId, function(err, requestersName) {
			if (err) throw err;
			console.log(requestersName);
			res.json({
				requestedBooks: requestedBooks,
				namesOfRequesters: requestersName
			});
		});
	});
});

//----------Get Books requested by the user-----------------
router.route('/:userId/booksRequestedByTheUser').get(function(req, res) {
	const userId = req.params.userId;
	bookBankDB.getBooksRequestedByTheUser(userId, function(err, requestedBooksByTheUser) {
		if (err) throw err;
		console.log(requestedBooksByTheUser);

		var ownersIdOfTheRequestedBooks = requestedBooksByTheUser.map(function(book) {
			return book.requesterId;
		});

		//------find owners name of the requestd books the user-----------------
		bookBankDB.findRequesterName(ownersIdOfTheRequestedBooks, function(err, ownersName) {
			if (err) throw err;
			console.log(ownersName);
			res.json({
				requestedBooks: requestedBooksByTheUser,
				namesOfOwners: ownersName
			});
		});
	});
});
//-------------ACCEPT BOOK REQUEST--------------
router.route('/:userId/booksRequestedByTheUser/:donatedBookId/AcceptRequest').post(function(req, res) {
	const userId = req.params.userId;
	const donatedBookId = req.params.donatedBookId;
	bookBankDB.updateRequestedBookToAccepted(userId, donatedBookId, function(err, requestedBookAccepted) {
		if (err) throw err;
		// res.json(requestedBookAcceped);
		console.log(requestedBookAccepted);
		var acceptedDonatedBookId = requestedBookAccepted.donatedBookId;
		bookBankDB.makeDonatedBookUnavailable(acceptedDonatedBookId, function(err, donatedBook) {
			if (err) throw err;
			res.json(donatedBook);
		});
	});
});

//-------------IGNORE BOOK REQUEST--------------
router.route('/:userId/booksRequestedByTheUser/:donatedBookId/IgnoreRequest').post(function(req, res) {
	const userId = req.params.userId;
	const donatedBookId = req.params.donatedBookId;
	bookBankDB.updateRequestedBookToIgnored(userId, donatedBookId, function(err, requestedBookIgnored) {
		if (err) throw err;
		res.json(requestedBookIgnored);
	});
});

module.exports = router;
