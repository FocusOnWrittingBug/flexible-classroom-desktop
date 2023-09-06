import { Button } from '@app/components/button';
import { Field } from '@app/components/form-field';
import { Layout } from '@app/components/layout';
import { GlobalStoreContext } from '@app/stores';
import { transI18n, useI18n } from 'agora-common-libs';
import { FC, useContext, useMemo, useState } from 'react';
import md5 from 'js-md5';
import { useJoinRoom } from '@app/hooks';
import type { EduRoleTypeEnum, Platform } from 'agora-edu-core';
import { parseHashUrlQuery } from '@app/utils/url';
import { useNoAuthUser } from '@app/hooks/useNoAuthUser';

const useForm = <T extends Record<string, string>>({
  initialValues,
  validate,
}: {
  initialValues: T | (() => T);
  validate: (
    values: T,
    fieldName: keyof T,
    onError: (field: keyof T, message: string) => void,
  ) => void;
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleValidate = (fieldName: keyof T, temp: typeof errors = {}) =>
    validate(values, fieldName, (fieldName: keyof T, message: string) => {
      temp[fieldName] = message;
    });

  return {
    values,
    errors,
    validate: () => {
      const temp = {};
      Object.keys(values).forEach((fieldName) => {
        handleValidate(fieldName, temp);
      });

      setErrors(temp);

      return !Object.keys(temp).length;
    },
    eventHandlers: (fieldName: keyof T) => ({
      onChange: (value: string) => {
        if (value === '') {
          // const temp = { ...errors };
          // delete temp[fieldName];
          // setErrors(temp);
        }
        setValues({
          ...values,
          [fieldName]: value,
        });
      },
      onBlur: () => {
        const value = values[fieldName];
        if (value === '') {
          // const temp = { ...errors };
          // delete temp[fieldName];
          // setErrors(temp);
        } else {
          const temp = { ...errors };
          delete temp[fieldName];
          handleValidate(fieldName, temp);
          setErrors(temp);
        }
      },
      onKeyUp: () => {
        const temp = { ...errors };
        delete temp[fieldName];
        handleValidate(fieldName, temp);
        setErrors(temp);
      },
    }),
  };
};

export const JoinForm: FC<{
  onSubmit: () => boolean;
}> = ({ onSubmit }) => {
  const t = useI18n();
  const globalStore = useContext(GlobalStoreContext);
  const { quickJoinRoomNoAuth } = useJoinRoom();
  const params = useMemo(() => {
    return parseHashUrlQuery(window.location.hash);
  }, []);
  const { nickName, setNickName } = useNoAuthUser();
  const roleOptions = [
    { text: t('home.role_teacher'), value: '1' },
    { text: t('home.role_student'), value: '2' },
    { text: t('home.role_assistant'), value: '3' },
    { text: t('home.role_audience'), value: '0' },
  ];

  const { values, errors, eventHandlers, validate } = useForm({
    initialValues: () => {
      const launchConfig = globalStore.launchConfig;
      const { roomUuid, userName, roleType } = launchConfig;

      return {
        roomUuid: `${params.roomId ?? roomUuid ?? ''}`,
        userName: window.__launchUserName || `${userName ?? nickName ?? ''}`,
        roleType: window.__launchRoleType || `${roleType ?? 2}`,
      };
    },
    validate: (values, fieldName, onError) => {
      switch (fieldName) {
        case 'roomUuid':
          if (!values.roomUuid) {
            return onError('roomUuid', transI18n('home_form_placeholder_room_id'));
          }
          if (values.roomUuid.length !== 9) {
            return onError('roomUuid', transI18n('home_form_error_room_id_limit', { min: 9 }));
          }
          break;
        case 'userName':
          if (!values.userName) {
            return onError('userName', transI18n('home_form_error_user_name_empty'));
          }
          if (values.userName.length < 2 || values.userName.length > 20) {
            return onError(
              'userName',
              transI18n('home_form_error_user_name_limit', { min: 2, max: 20 }),
            );
          }
          break;
        case 'roleType':
          !values.roleType && onError('roleType', transI18n('home_form_error_role_type_empty'));
          break;
      }
    },
  });

  const { roomUuid, userName, roleType } = values;

  const handleSubmit = () => {
    if (validate() && onSubmit()) {
      const role = parseInt(roleType) as EduRoleTypeEnum;
      const userUuid = md5(`${userName}_${role}-main`);
      globalStore.setLoading(true);
      setNickName(userName);
      quickJoinRoomNoAuth(
        {
          role: role,
          roomId: roomUuid,
          nickName: userName,
          platform: 'PC' as Platform,
          userId: userUuid,
        },
        {
          returnToPath: params.roomId ? `/quick-start?roomId=${params.roomId}` : '/quick-start',
        },
      ).finally(() => {
        globalStore.setLoading(false);
      });
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        return false;
      }}>
      <Layout className="fcr-mt-8">
        <Field
          label={t('home_form_field_room_id')}
          type="text"
          placeholder={t('home_form_placeholder_room_id')}
          width={369}
          value={roomUuid}
          {...eventHandlers('roomUuid')}
          error={errors.roomUuid}
        />
      </Layout>

      <Layout className="fcr-mt-6 fcr-relative fcr-z-20">
        <Field
          label={t('home_form_field_name')}
          type="text"
          placeholder={t('home_form_placeholder_user_name')}
          width={369}
          value={userName}
          {...eventHandlers('userName')}
          error={errors.userName}
        />
      </Layout>
      <Layout className="fcr-mt-6 fcr-relative fcr-z-20">
        <Field
          label={t('home_form_field_role')}
          type="select"
          placeholder={t('home_form_placeholder_user_role')}
          width={369}
          value={roleType}
          options={roleOptions}
          {...eventHandlers('roleType')}
          error={errors.roleType}
        />
      </Layout>
      <Layout className="fcr-mt-8 fcr-mb-6">
        <Button
          className="form-submit-button fcr-w-full"
          size="lg"
          type={'primary'}
          onClick={handleSubmit}>
          {t('fcr_login_free_button_join')}
        </Button>
      </Layout>
    </form>
  );
};
