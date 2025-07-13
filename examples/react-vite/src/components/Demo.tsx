import { T, useTranslation, NumberFormat, DateFormat, RelativeTime } from '@oxog/i18n-react';
import { useState } from 'react';

export function Demo() {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [name, setName] = useState('World');
  
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return (
    <div className="demo">
      <h1><T id="app.title" /></h1>
      <p><T id="app.description" /></p>
      
      <section>
        <h2><T id="welcome.title" /></h2>
        <p><T id="welcome.subtitle" /></p>
      </section>
      
      <section>
        <h3>Interactive Demo</h3>
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
          <p>{t('greeting', { name })}</p>
        </div>
        
        <div>
          <button onClick={() => setCount(count - 1)}>-</button>
          <span> {count} </span>
          <button onClick={() => setCount(count + 1)}>+</button>
          <p><T id="items.count" values={{ count }} /></p>
        </div>
      </section>
      
      <section>
        <h3><T id="demo.formats.title" /></h3>
        <ul>
          <li>
            Number: <NumberFormat value={1234.56} />
          </li>
          <li>
            Currency: <NumberFormat value={1234.56} format="currency" />
          </li>
          <li>
            Date (short): <DateFormat value={now} format="short" />
          </li>
          <li>
            Date (long): <DateFormat value={now} format="long" />
          </li>
          <li>
            Relative time: <RelativeTime value={yesterday} />
          </li>
        </ul>
      </section>
      
      <section>
        <h3>Navigation Example</h3>
        <nav>
          <a href="#"><T id="nav.home" /></a>
          <a href="#"><T id="nav.about" /></a>
          <a href="#"><T id="nav.contact" /></a>
        </nav>
      </section>
    </div>
  );
}