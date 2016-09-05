﻿define(['cardBuilder', 'emby-itemscontainer'], function (cardBuilder) {

    return function (view, params) {

        // The base query options
        var query = {
            UserId: Dashboard.getCurrentUserId(),
            StartIndex: 0,
            Fields: "ChannelInfo"
        };

        if (params.type == 'Recordings') {
            query.IsInProgress = false;
        } else {
            query.HasAired = false;
            query.SortBy = 'StartDate,SortName';
            query.SortOrder = 'Ascending';
        }

        function getSavedQueryKey() {
            return LibraryBrowser.getSavedQueryKey();
        }

        function reloadItems(page) {

            Dashboard.showLoadingMsg();

            var promise = params.type == 'Recordings' ?
                ApiClient.getLiveTvRecordings(query) :
                ApiClient.getLiveTvPrograms(query);

            promise.then(function (result) {

                // Scroll back up so they can see the results from the beginning
                window.scrollTo(0, 0);

                var html = '';
                var pagingHtml = LibraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: false
                });

                page.querySelector('.listTopPaging').innerHTML = pagingHtml;

                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: query.IsMovie ? 'portrait' : "backdrop",
                    preferThumb: !query.IsMovie,
                    context: 'livetv',
                    centerText: true,
                    lazy: true,
                    overlayText: false,
                    showTitle: true,
                    //showParentTitle: query.IsSeries !== false && !query.IsMovie,
                    showProgramAirInfo: params.type != 'Recordings',
                    overlayMoreButton: true,
                    showYear: query.IsMovie && params.type == 'Recordings'
                });

                var elem = page.querySelector('.itemsContainer');
                elem.innerHTML = html + pagingHtml;
                ImageLoader.lazyChildren(elem);

                var i, length;
                var elems;

                function onNextPageClick() {
                    query.StartIndex += query.Limit;
                    reloadItems(page);
                }

                function onPreviousPageClick() {
                    query.StartIndex -= query.Limit;
                    reloadItems(page);
                }

                elems = page.querySelectorAll('.btnNextPage');
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener('click', onNextPageClick);
                }

                elems = page.querySelectorAll('.btnPreviousPage');
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener('click', onPreviousPageClick);
                }

                LibraryBrowser.saveQueryValues(getSavedQueryKey(), query);

                Dashboard.hideLoadingMsg();
            });
        }

        view.addEventListener('viewbeforeshow', function () {

            query.ParentId = LibraryMenu.getTopParentId();

            var page = this;
            var limit = LibraryBrowser.getDefaultPageSize();

            // If the default page size has changed, the start index will have to be reset
            if (limit != query.Limit) {
                query.Limit = limit;
                query.StartIndex = 0;
            }

            if (params.IsMovie == 'true') {
                query.IsMovie = true;
            }
            else if (params.IsMovie == 'true') {
                query.IsMovie = false;
            }
            if (params.IsSports == 'true') {
                query.IsSports = true;
            }
            else if (params.IsSports == 'true') {
                query.IsSports = false;
            }
            if (params.IsKids == 'true') {
                query.IsKids = true;
            }
            else if (params.IsKids == 'true') {
                query.IsKids = false;
            }

            var viewkey = getSavedQueryKey();

            LibraryBrowser.loadSavedQueryValues(viewkey, query);

            reloadItems(page);
        });
    };
});