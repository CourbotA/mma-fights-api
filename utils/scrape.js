const cheerio = require('cheerio')
const axios = require('axios')

const scrape = async () => {
  
  const baseUrl = 'https://www.tapology.com'

  //load all the upcoming fightcards on tapology > select next 10 from major Orgs

  const response = await axios.get(`${baseUrl}/fightcenter?group=major&schedule=upcoming`);
  const $ = cheerio.load(response.data);

  const majorOrgs = ['UFC', 'PFL', 'BELLATOR', 'ONE', 'RIZIN'];
  
  let events = $('.left').map((_, el) => {
    const title = $(el).find('.name').text().trim();
    const date = $(el).find('.datetime').text().trim();
    const link = baseUrl + $(el).find('.name a').attr('href');
  
    return { title, date, link };
  })
  .get()
  .filter((event) => majorOrgs.some((org) => event.title.toUpperCase().includes(org)))
  .slice(0, 10);

  //select fight info from each fight on each fightCard

  for (const event of events) {
    const eventResponse = await axios.get(event.link);
    const $event = cheerio.load(eventResponse.data);

    const fights = $event('li.fightCard:not(.picks)').map((_, el) => {
      const main = $(el).find('.billing').text().toLowerCase().includes('main') ? true : false;
      const fighterA = {
        name: $(el).find('.fightCardFighterName.left a').text(),
        link: baseUrl + $(el).find('.fightCardFighterBout.left a').attr('href'),
      };
      const fighterB = {
        name: $(el).find('.fightCardFighterName.right a').text(),
        link: baseUrl + $(el).find('.fightCardFighterBout.right a').attr('href'),
      };

      return { main, fighterA, fighterB }
    }).get()

    event.fights = fights
  }

  return events.filter(event => event.fights.length > 4)
}

module.exports = scrape
