import { observer } from 'mobx-react';
import { applySnapshot, getSnapshot } from 'mobx-state-tree';
import { useEffect, useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';
import { Redirect, useParams } from 'react-router-dom';
import instance from 'src/helpers/instance';
import useStore from 'src/stores';
import { useCollection } from 'src/stores/collection';
import { usePins } from 'src/stores/pin';
import { useUsers } from 'src/stores/user';

import GridImage from '../GridImage';
import Button from '../Layout/Button';
import Dropdown from '../Layout/Dropdown';
import List from '../Layout/List';
import ModalDeletePin from '../Pin/ModalDeletePin';
import ModalFormPin from '../Pin/ModalFormPin';
import styles from './collection.module.scss';

const Collection = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Redirect to="/" />;
  // eslint-disable-next-line
  const { listPin, isLoading, page, countPin, incrementPage, detailPin, toggleModalShowFormPin, getPins, setLoading } = usePins();
  const collection = useCollection();
  const { title, isPublic, user_id: userId, fetched, setFetched } = collection;
  const { getUser, detailUser: user } = useUsers();
  const { userModel } = useStore();
  const { detailUser } = userModel;
  const isYourself = detailUser.id === userId;

  const [isActive, setActive] = useState<boolean>(false);
  const toggleActive = () => setActive(!isActive);
  useEffect(() => {
    document.title = collection.isLoading ? 'Loading...' : collection.title;
  }, [collection.title, collection.isLoading]);

  // const [tSearch, setTSearch] = useState<string>('');
  const loadMore = useRef(null);
  const fetchPins = async () => {
    setLoading(true);
    if (slug) await getPins('', slug);
    setLoading(false);
  };

  // useEffect(() => {
  //   applySnapshot(listPin, []);
  //   setPage(0);
  // }, [tSearch]);
  useEffect(() => {
    const run = async () => {
      try {
        collection.setLoading(true);
        const response = await instance.get(`/collection/${slug}`);
        await getUser(response.data.user_id, false);
        applySnapshot(collection, response.data);
        setFetched(true);
      } catch {
        window.location.href = '/';
      } finally {
        collection.setLoading(false);
      }
    };
    if (slug) run();
  }, [slug]);

  useEffect(() => {
    fetchPins();
  }, [page, slug]);

  useEffect(() => {
    document.title = 'Clone Pinterest';
    if (loadMore.current) {
      const obss = new IntersectionObserver(
        async (entry) => {
          if (entry[0].isIntersecting) {
            incrementPage();
            if (listPin.length >= countPin) {
              obss.unobserve(entry[0].target);
            }
          }
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: 0,
        },
      );
      obss.observe(loadMore.current);
    }
  }, [countPin, loadMore.current]);

  if (fetched && detailUser.fetched && detailUser.id !== userId && !isPublic) return <Redirect to="/" />;
  return (
    <div className={styles.collection}>
      {user.isLoading || collection.isLoading ? (
        <div className="loader size-lg" />
      ) : (
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.avatar}>
            {user.avatar ? (
              <img
                src={`${process.env.REACT_APP_SERVER}/${process.env.REACT_APP_FOLDER_IMAGE}/${user.avatar}`}
                alt="avatar"
              />
            ) : (
              <FaUser size="24" color="rgb(108 108 108)" />
            )}
          </div>
          <h4 className={styles.fullname}>{user.fullname}</h4>
        </div>
      )}
      <GridImage items={getSnapshot(listPin)} isShowAction={isYourself} />
      <div ref={loadMore} style={{ height: '50px' }}>
        {isLoading && <div className="loader size-lg"> </div>}
      </div>
      {isYourself && (
        <>
          <div className={styles.actions}>
            <Dropdown
              isShow={isActive}
              align="left"
              activator={
                <Button className={styles.btnDropdown} onClick={toggleActive}>
                  <FiPlus size="32" />
                </Button>
              }
              onClose={toggleActive}
            >
              <List>
                <List.Item main> Tạo </List.Item>
                <List.Item
                  onClick={() => {
                    toggleModalShowFormPin();
                    detailPin.setTypeForm('add');
                  }}
                >
                  Ghim
                </List.Item>
              </List>
            </Dropdown>
          </div>
          <ModalDeletePin />
          <ModalFormPin cId={collection.id} />
        </>
      )}
    </div>
  );
};
export default observer(Collection);
